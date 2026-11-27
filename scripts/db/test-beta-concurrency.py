"""Real concurrent transactions, only in the disposable migration-test database.

Uses the same PG* connection variables and psql as test-migrations.sh. Fixtures
must commit to be visible to other sessions; all are removed in finally blocks.
"""

import json
import os
import subprocess
import time
import uuid


def query(sql):
    return subprocess.run(
        ["psql", "-XqAt", "-v", "ON_ERROR_STOP=1", "-c", sql],
        check=True, capture_output=True, text=True, timeout=20,
    ).stdout.strip()


def redeem(user_id, code):
    return (
        "set local role authenticated; "
        f"select set_config('request.jwt.claim.sub', '{user_id}', true); "
        f"select public.mpk_redeem_beta_invite('{code}');"
    )


def race(owner_sql, waiting_sql):
    """Hold the settings lock until every competing operation is blocked on it."""
    holder = subprocess.Popen(
        ["psql", "-XqAt", "-v", "ON_ERROR_STOP=1"],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True,
    )
    workers = []
    try:
        holder.stdin.write("begin; select id from private.beta_settings where id for update;\n")
        holder.stdin.flush()
        assert holder.stdout.readline().strip() == "t", "holder must acquire settings first"
        names = []
        for sql in waiting_sql:
            name = "beta-race-" + uuid.uuid4().hex
            names.append("'" + name + "'")
            workers.append(subprocess.Popen(
                ["psql", "-XqAt", "-v", "ON_ERROR_STOP=1", "-c", "begin; " + sql + " commit;"],
                env={**os.environ, "PGAPPNAME": name},
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
            ))
        deadline = time.monotonic() + 10
        while True:
            blocked = int(query(
                "select count(*) from pg_stat_activity where application_name in ("
                + ",".join(names) + ") and wait_event_type = 'Lock'"
            ))
            if blocked == len(workers):
                break
            assert time.monotonic() < deadline, "competitors did not take the shared settings lock"
            time.sleep(0.05)
        output, error = holder.communicate(owner_sql + " commit;\n", timeout=20)
        assert holder.returncode == 0, error
        results = [output.strip().splitlines()[-1]]
        for worker in workers:
            output, error = worker.communicate(timeout=20)
            assert worker.returncode == 0, error
            results.append(output.strip().splitlines()[-1])
        return results
    finally:
        for process in [holder, *workers]:
            if process.poll() is None:
                process.kill()
                process.communicate()


if query("select obj_description('auth.users'::regclass, 'pg_class')") != "mpk-disposable-migration-test":
    raise SystemExit("Refusing concurrency tests outside the disposable auth shim.")

settings = query("select row_to_json(s) from private.beta_settings s where id")
settings = json.loads(settings)

for scenario in ("final_use", "expiry", "revocation", "seat_limit"):
    first, second = str(uuid.uuid4()), str(uuid.uuid4())
    code = "RACE-" + uuid.uuid4().hex[:16].upper()
    other = "RACE-" + uuid.uuid4().hex[:16].upper()
    try:
        query(f"""
            insert into auth.users (id, email, raw_user_meta_data) values
              ('{first}', '{first}@example.test', '{{"first_name":"Concurrent","last_name":"First","beta_invite_code":"{code}"}}'),
              ('{second}', '{second}@example.test', '{{"first_name":"Concurrent","last_name":"Second","beta_invite_code":"{code}"}}');
            select public.mpk_admin_create_beta_invite('{code}', 'Concurrent fixture', 1, null);
            select public.mpk_admin_update_beta_settings(10000, 90);
        """)
        cleanup = "select private.purge_beta_invites();"
        if scenario == "final_use":
            results = race(redeem(first, code), [redeem(second, code), cleanup])
            assert json.loads(results[0])["status"] == "redeemed"
            assert json.loads(results[1])["status"] == "invalid"
            assert results[2] == "0"
        elif scenario == "expiry":
            query(f"update private.beta_invites set expires_at = now() where code = '{code}'")
            results = race(cleanup, [redeem(second, code), cleanup])
            assert results[0] == "1" and results[2] == "0"
            assert json.loads(results[1])["status"] == "invalid"
        elif scenario == "revocation":
            results = race(
                f"select public.mpk_admin_revoke_beta_invite('{code}'); select 'revoked';",
                [redeem(second, code), cleanup],
            )
            assert json.loads(results[1])["status"] == "invalid"
        else:
            query(f"""
                select public.mpk_admin_create_beta_invite('{other}', 'Other seat', 1, null);
                select public.mpk_admin_update_beta_settings(private.beta_seats_used() + 1, 90);
            """)
            results = race(redeem(first, code), [redeem(second, other), cleanup])
            assert json.loads(results[0])["status"] == "redeemed"
            assert json.loads(results[1])["status"] == "beta_full"
            assert query(f"select use_count from private.beta_invites where code = '{other}'") == "0"

        expected = "1" if scenario in ("final_use", "seat_limit") else "0"
        assert query(f"select count(*) from public.entitlements where user_id in ('{first}','{second}')") == expected
        assert query(f"select count(*) from private.beta_redemptions where user_id in ('{first}','{second}') and code is null") == expected
        assert query(f"select count(*) from private.beta_invites where code = '{code}'") == "0"
        assert query(f"select count(*) from auth.users where id in ('{first}','{second}') and raw_user_meta_data ? 'beta_invite_code'") == "0"
        print(f"Beta concurrency passed: {scenario}", flush=True)
    finally:
        query(f"""
            delete from auth.users where id in ('{first}', '{second}');
            delete from private.beta_invites where code in ('{code}', '{other}');
            update private.beta_settings set seat_limit = {settings['seat_limit']},
              access_days = {settings['access_days']}, updated_at = '{settings['updated_at']}' where id;
        """)
