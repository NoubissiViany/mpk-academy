#!/usr/bin/env bash
# Applies every migration to an empty, disposable Postgres and runs the
# rollback-only *.assert.sql files. The connection comes from the standard PG*
# variables (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE).
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
run() { psql -X -v ON_ERROR_STOP=1 -q "$@"; }

# A real Supabase database already has an auth schema; refuse to touch it.
if [ "$(run -tAc "select to_regnamespace('auth') is not null")" = "t" ]; then
  echo "Refusing to run: this database already has an auth schema." >&2
  exit 1
fi

run -f "$root/scripts/db/shim.sql"
for file in "$root"/supabase/migrations/*.sql; do
  echo "apply $(basename "$file")"
  run -f "$file"
done
for file in "$root"/supabase/tests/database/*.assert.sql; do
  echo "check $(basename "$file")"
  run -f "$file"
done
echo "Database assertions passed."
