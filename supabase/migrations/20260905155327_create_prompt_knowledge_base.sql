create table public.model_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  display_name text not null,
  description text,
  system_guidance text not null,
  output_contract text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prompt_rules (
  id uuid primary key default gen_random_uuid(),
  model_profile_id uuid not null references public.model_profiles(id) on delete cascade,
  rule_key text not null,
  rule_text text not null,
  priority smallint not null default 100 check (priority between 1 and 999),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (model_profile_id, rule_key)
);

create table public.prompt_examples (
  id uuid primary key default gen_random_uuid(),
  model_profile_id uuid not null references public.model_profiles(id) on delete cascade,
  title text not null,
  user_brief text not null,
  expected_prompt text not null,
  quality_notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.model_profiles enable row level security;
alter table public.prompt_rules enable row level security;
alter table public.prompt_examples enable row level security;

revoke all on table public.model_profiles, public.prompt_rules, public.prompt_examples from anon, authenticated;
grant select on table public.model_profiles, public.prompt_rules, public.prompt_examples to anon, authenticated;

create policy "public can read active model profiles"
on public.model_profiles for select to anon, authenticated
using (is_active = true);

create policy "public can read active prompt rules"
on public.prompt_rules for select to anon, authenticated
using (is_active = true);

create policy "public can read active prompt examples"
on public.prompt_examples for select to anon, authenticated
using (is_active = true);
