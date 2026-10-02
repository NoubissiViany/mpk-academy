create or replace function public.mpk_fulfill_stripe_purchase(
  p_user_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_plan_id text,
  p_subtotal_minor integer,
  p_tax_minor integer,
  p_total_minor integer,
  p_currency text,
  p_purchased_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_subtotal integer;
  access_months integer;
  purchase_record public.purchases%rowtype;
begin
  if p_user_id is null
    or nullif(trim(p_checkout_session_id), '') is null
    or nullif(trim(p_payment_intent_id), '') is null then
    raise exception 'Invalid Stripe purchase identifiers' using errcode = '22023';
  end if;

  expected_subtotal := case p_plan_id
    when 'essential' then 12286
    when 'complete' then 25675
    when 'intensive' then 35973
    else null
  end;
  access_months := case p_plan_id
    when 'essential' then 3
    when 'complete' then 6
    when 'intensive' then 6
    else null
  end;

  if expected_subtotal is null
    or upper(p_currency) <> 'CAD'
    or p_subtotal_minor <> expected_subtotal
    or p_tax_minor < 0
    or p_total_minor <> p_subtotal_minor + p_tax_minor then
    raise exception 'Stripe purchase amount does not match the plan' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 0)
  );

  select * into purchase_record
  from public.purchases
  where external_purchase_id = p_checkout_session_id
     or checkout_session_id = p_checkout_session_id
     or payment_intent_id = p_payment_intent_id
  limit 1;

  if found then
    if purchase_record.user_id <> p_user_id
      or purchase_record.plan_id <> p_plan_id then
      raise exception 'Stripe purchase ownership does not match' using errcode = '22023';
    end if;

    update public.purchases
    set status = 'paid',
        checkout_session_id = p_checkout_session_id,
        payment_intent_id = p_payment_intent_id,
        subtotal_minor = p_subtotal_minor,
        tax_minor = p_tax_minor,
        amount_minor = p_total_minor,
        currency = upper(p_currency),
        purchased_at = p_purchased_at
    where id = purchase_record.id
    returning * into purchase_record;
  else
    insert into public.purchases (
      user_id,
      provider,
      external_purchase_id,
      checkout_session_id,
      payment_intent_id,
      plan_id,
      status,
      subtotal_minor,
      tax_minor,
      amount_minor,
      currency,
      purchased_at
    ) values (
      p_user_id,
      'stripe',
      p_checkout_session_id,
      p_checkout_session_id,
      p_payment_intent_id,
      p_plan_id,
      'paid',
      p_subtotal_minor,
      p_tax_minor,
      p_total_minor,
      upper(p_currency),
      p_purchased_at
    ) returning * into purchase_record;
  end if;

  update public.entitlements
  set status = 'revoked'
  where user_id = p_user_id
    and status = 'active'
    and purchase_id is distinct from purchase_record.id;

  insert into public.entitlements (
    user_id,
    purchase_id,
    plan_id,
    status,
    starts_at,
    ends_at
  ) values (
    p_user_id,
    purchase_record.id,
    p_plan_id,
    'active',
    p_purchased_at,
    p_purchased_at + pg_catalog.make_interval(months => access_months)
  )
  on conflict (purchase_id) where purchase_id is not null
  do update set
    plan_id = excluded.plan_id,
    status = 'active',
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at;

  return purchase_record.id;
end;
$$;

revoke all on function public.mpk_fulfill_stripe_purchase(
  uuid, text, text, text, integer, integer, integer, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.mpk_fulfill_stripe_purchase(
  uuid, text, text, text, integer, integer, integer, text, timestamptz
) to service_role;
