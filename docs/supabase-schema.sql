create table if not exists survey_forms (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'RTBIO Event Survey',
  version integer not null default 1,
  questions_json jsonb not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references survey_forms(id),
  form_version integer not null default 1,
  name text not null,
  company text not null,
  title text not null,
  phone text not null,
  email text not null,
  privacy_agreed boolean not null default false,
  completion_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists survey_responses (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  answers_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists redemptions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references participants(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'redeemed')),
  redeemed_at timestamptz,
  redeemed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists participants_completion_code_idx on participants(completion_code);
create index if not exists participants_phone_idx on participants(phone);
create index if not exists participants_email_idx on participants(email);
create index if not exists redemptions_status_idx on redemptions(status);
