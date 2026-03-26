-- Mirror new Auth users into public.bh_customers (complements app-level upsert on sign-in).
-- Run in Supabase SQL editor or via CLI. Requires access to auth schema.

create or replace function public.sync_auth_user_to_bh_customers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or length(trim(new.email)) = 0 then
    return new;
  end if;

  insert into public.bh_customers (id, email, name, updated_at)
  values (
    new.id,
    lower(trim(new.email)),
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      nullif(trim(new.email), '')
    ),
    now()
  )
  on conflict (email) do update
    set
      name = coalesce(
        excluded.name,
        public.bh_customers.name
      ),
      updated_at = now();

  return new;
end;
$$;

-- Postgres 11+ trigger syntax; drop first because there is no CREATE OR REPLACE TRIGGER
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.sync_auth_user_to_bh_customers();

comment on function public.sync_auth_user_to_bh_customers() is
  'After auth.users insert: upsert bh_customers by email (id = auth user id on first insert).';
