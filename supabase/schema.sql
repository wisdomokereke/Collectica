-- ============================================================
-- COLLECTICA — Full Database Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ── Enable UUID extension ───────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists profiles (
  id              uuid primary key references auth.users on delete cascade,
  email           text,
  full_name       text not null,
  role            text not null check (role in ('freelancer', 'client')),
  skills          text,           -- freelancers: comma-separated skills
  company         text,           -- clients: company name
  use_case        text,           -- what they plan to use Collectica for
  location        text,
  bio             text,
  avatar_url      text,
  trust_score     integer default 70 check (trust_score between 0 and 100),
  wallet_balance  bigint  default 0,   -- in kobo (1 NGN = 100 kobo)
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

-- ============================================================
-- CONTRACTS
-- ============================================================
create table if not exists contracts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  job_type        text,
  freelancer_id   uuid references profiles(id) on delete set null,
  client_id       uuid references profiles(id) on delete set null,
  total_amount    bigint not null default 0,   -- kobo
  duration        text,
  status          text default 'pending' check (status in ('pending','active','review','completed','disputed','cancelled')),
  ai_contract     text,    -- AI-generated contract text
  signed_at       timestamptz,
  deadline        timestamptz,
  created_at      timestamptz default now()
);

-- ============================================================
-- MILESTONES
-- ============================================================
create table if not exists milestones (
  id              uuid primary key default gen_random_uuid(),
  contract_id     uuid not null references contracts(id) on delete cascade,
  title           text not null,
  description     text,
  amount          bigint not null default 0,   -- kobo
  position        integer default 1,
  review_rounds   integer default 2 check (review_rounds between 1 and 3),
  reviews_used    integer default 0,
  status          text default 'pending' check (status in ('pending','submitted','in_review','approved','disputed')),
  satisfaction_expressed boolean default false,
  created_at      timestamptz default now()
);

-- ============================================================
-- MILESTONE SUBMISSIONS
-- (created when freelancer sends a file in chat or submits milestone)
-- ============================================================
create table if not exists milestone_submissions (
  id              uuid primary key default gen_random_uuid(),
  milestone_id    uuid references milestones(id) on delete cascade,
  contract_id     uuid references contracts(id) on delete cascade,
  freelancer_id   uuid references profiles(id),
  client_id       uuid references profiles(id),
  file_url        text,
  file_name       text,
  file_size       bigint,
  ai_score        integer,
  ai_verified     boolean default false,
  review_count    integer default 0,
  revision_note   text,
  status          text default 'pending' check (status in ('pending','approved','revision_requested')),
  approved_at     timestamptz,
  created_at      timestamptz default now()
);

-- ============================================================
-- ESCROW ACCOUNTS
-- (one per contract — funded by client before work starts)
-- ============================================================
create table if not exists escrow_accounts (
  id              uuid primary key default gen_random_uuid(),
  contract_id     uuid unique references contracts(id) on delete cascade,
  client_id       uuid references profiles(id),
  freelancer_id   uuid references profiles(id),
  total_amount    bigint default 0,
  locked_amount   bigint default 0,
  released_amount bigint default 0,
  funded_at       timestamptz,
  created_at      timestamptz default now()
);

-- ============================================================
-- WALLET TRANSACTIONS
-- (all money movements for every user)
-- ============================================================
create table if not exists wallet_transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  type            text not null check (type in ('deposit','withdrawal','escrow_lock','escrow_release','refund')),
  amount          bigint not null,
  description     text,
  contract_id     uuid references contracts(id) on delete set null,
  created_at      timestamptz default now()
);

-- ============================================================
-- CONVERSATIONS
-- (one per contract — where client & freelancer chat)
-- ============================================================
create table if not exists conversations (
  id              uuid primary key default gen_random_uuid(),
  contract_id     uuid unique references contracts(id) on delete cascade,
  user1_id        uuid not null references profiles(id),  -- freelancer
  user2_id        uuid not null references profiles(id),  -- client
  last_message_at timestamptz default now(),
  created_at      timestamptz default now()
);

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       text not null,    -- profile id or 'ai' or 'system'
  recipient_id    uuid references profiles(id),
  content         text,
  is_system       boolean default false,
  is_ai           boolean default false,
  is_read         boolean default false,
  file_url        text,
  file_name       text,
  file_type       text,
  file_size       bigint,
  is_milestone    boolean default false,
  milestone_id    uuid references milestones(id) on delete set null,
  created_at      timestamptz default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  title           text not null,
  body            text,
  type            text,   -- 'milestone','payment','contract','alert'
  is_read         boolean default false,
  contract_id     uuid references contracts(id) on delete set null,
  milestone_id    uuid references milestones(id) on delete set null,
  created_at      timestamptz default now()
);

-- ============================================================
-- ACTIVITY LOG
-- (real-time feed on dashboard)
-- ============================================================
create table if not exists activity_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  description     text not null,
  emoji           text default '🔔',
  type            text,   -- 'payment','contract','milestone','alert'
  contract_id     uuid references contracts(id) on delete set null,
  created_at      timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles            enable row level security;
alter table contracts           enable row level security;
alter table milestones          enable row level security;
alter table milestone_submissions enable row level security;
alter table escrow_accounts     enable row level security;
alter table wallet_transactions enable row level security;
alter table conversations       enable row level security;
alter table messages            enable row level security;
alter table notifications       enable row level security;
alter table activity_log        enable row level security;

-- PROFILES: anyone logged in can read, only owner can write
create policy "Profiles are viewable by all authenticated users"
  on profiles for select to authenticated using (true);

create policy "Users can insert their own profile"
  on profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update to authenticated using (auth.uid() = id);

-- CONTRACTS: participants can view
create policy "Contract participants can view"
  on contracts for select to authenticated
  using (auth.uid() = freelancer_id or auth.uid() = client_id);

create policy "Authenticated users can create contracts"
  on contracts for insert to authenticated with check (true);

create policy "Contract participants can update"
  on contracts for update to authenticated
  using (auth.uid() = freelancer_id or auth.uid() = client_id);

-- MILESTONES: contract participants
create policy "Milestone participants can view"
  on milestones for select to authenticated
  using (
    exists (select 1 from contracts c where c.id = contract_id
      and (c.freelancer_id = auth.uid() or c.client_id = auth.uid()))
  );

create policy "Contract parties can insert milestones"
  on milestones for insert to authenticated with check (true);

create policy "Contract parties can update milestones"
  on milestones for update to authenticated using (true);

-- MILESTONE_SUBMISSIONS
create policy "Submission participants can view"
  on milestone_submissions for select to authenticated
  using (auth.uid() = freelancer_id or auth.uid() = client_id);

create policy "Anyone authenticated can insert submissions"
  on milestone_submissions for insert to authenticated with check (true);

create policy "Participants can update submissions"
  on milestone_submissions for update to authenticated
  using (auth.uid() = freelancer_id or auth.uid() = client_id);

-- ESCROW ACCOUNTS
create policy "Escrow participants can view"
  on escrow_accounts for select to authenticated
  using (auth.uid() = client_id or auth.uid() = freelancer_id);

create policy "Anyone can create escrow accounts"
  on escrow_accounts for insert to authenticated with check (true);

create policy "Participants can update escrow"
  on escrow_accounts for update to authenticated
  using (auth.uid() = client_id or auth.uid() = freelancer_id);

-- WALLET TRANSACTIONS: own records only
create policy "Users can view own transactions"
  on wallet_transactions for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on wallet_transactions for insert to authenticated
  with check (auth.uid() = user_id);

-- CONVERSATIONS: participants
create policy "Conversation participants can view"
  on conversations for select to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Anyone authenticated can create conversations"
  on conversations for insert to authenticated with check (true);

create policy "Participants can update conversations"
  on conversations for update to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- MESSAGES: conversation participants
create policy "Message participants can view"
  on messages for select to authenticated
  using (
    exists (select 1 from conversations cv where cv.id = conversation_id
      and (cv.user1_id = auth.uid() or cv.user2_id = auth.uid()))
  );

create policy "Authenticated users can send messages"
  on messages for insert to authenticated with check (true);

create policy "Participants can update messages (mark read)"
  on messages for update to authenticated using (true);

-- NOTIFICATIONS: own only
create policy "Users can view own notifications"
  on notifications for select to authenticated
  using (auth.uid() = user_id);

create policy "Anyone can insert notifications"
  on notifications for insert to authenticated with check (true);

create policy "Users can update own notifications"
  on notifications for update to authenticated
  using (auth.uid() = user_id);

-- ACTIVITY LOG: own only
create policy "Users can view own activity"
  on activity_log for select to authenticated
  using (auth.uid() = user_id);

create policy "Anyone can insert activity"
  on activity_log for insert to authenticated with check (true);

-- ============================================================
-- REALTIME — enable for live updates
-- ============================================================
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table activity_log;
alter publication supabase_realtime add table milestone_submissions;
alter publication supabase_realtime add table escrow_accounts;
alter publication supabase_realtime add table contracts;

-- ============================================================
-- STORAGE — chat-files bucket (2GB limit per file)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-files',
  'chat-files',
  true,
  2147483648,  -- 2GB in bytes
  null         -- allow all file types
)
on conflict (id) do update set
  file_size_limit = 2147483648,
  public = true;

-- Storage policy: authenticated users can upload
create policy "Authenticated users can upload files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-files');

create policy "Anyone can view chat files"
  on storage.objects for select to authenticated
  using (bucket_id = 'chat-files');

create policy "File owners can delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'chat-files' and auth.uid()::text = (storage.foldername(name))[2]);

-- ============================================================
-- HELPER FUNCTION: log activity
-- ============================================================
create or replace function log_activity(
  p_user_id   uuid,
  p_desc      text,
  p_emoji     text default '🔔',
  p_type      text default 'general',
  p_contract  uuid default null
) returns void as $$
begin
  insert into activity_log (user_id, description, emoji, type, contract_id)
  values (p_user_id, p_desc, p_emoji, p_type, p_contract);
end;
$$ language plpgsql security definer;

-- ============================================================
-- DONE — Schema ready.
-- Next step: see SETUP.md for how to connect your app.
-- ============================================================
