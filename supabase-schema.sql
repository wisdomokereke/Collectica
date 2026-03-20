-- ═══════════════════════════════════════════════
--  COLLECTICA — Supabase Database Schema
--  Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- 1. PROFILES (extends Supabase auth.users)
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  role            text check (role in ('freelancer', 'client')) not null,
  skills          text,
  company         text,
  use_case        text,
  trust_score     int default 70,
  wallet_balance  numeric(12,2) default 0,
  created_at      timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'freelancer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 2. CONTRACTS
create table if not exists contracts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  total_amount    numeric(12,2) default 0,
  duration        text,
  status          text default 'pending' check (status in ('pending','active','review','completed','cancelled')),
  freelancer_id   uuid references profiles(id),
  client_id       uuid references profiles(id),
  contract_text   text,
  milestones      text, -- JSON string
  created_at      timestamptz default now()
);

-- 3. ESCROW ACCOUNTS
create table if not exists escrow_accounts (
  id              uuid primary key default gen_random_uuid(),
  contract_id     uuid references contracts(id) on delete cascade,
  freelancer_id   uuid references profiles(id),
  client_id       uuid references profiles(id),
  total_amount    numeric(12,2) default 0,
  locked_amount   numeric(12,2) default 0,
  released_amount numeric(12,2) default 0,
  milestones      text, -- JSON string
  created_at      timestamptz default now()
);

-- 4. CONVERSATIONS
create table if not exists conversations (
  id              uuid primary key default gen_random_uuid(),
  contract_id     uuid references contracts(id) on delete cascade,
  user1_id        uuid references profiles(id),
  user2_id        uuid references profiles(id),
  last_message_at timestamptz default now(),
  created_at      timestamptz default now()
);

-- 5. MESSAGES
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id       text not null, -- uuid or 'ai'
  recipient_id    uuid references profiles(id),
  content         text,
  file_url        text,
  file_name       text,
  file_type       text,
  file_size       bigint,
  is_read         boolean default false,
  is_system       boolean default false,
  is_ai           boolean default false,
  created_at      timestamptz default now()
);

-- 6. MILESTONE SUBMISSIONS
create table if not exists milestone_submissions (
  id              uuid primary key default gen_random_uuid(),
  contract_id     uuid references contracts(id),
  freelancer_id   uuid references profiles(id),
  client_id       uuid references profiles(id),
  title           text not null,
  amount          numeric(12,2) default 0,
  status          text default 'pending' check (status in ('pending','approved','revision')),
  file_url        text,
  file_name       text,
  ai_score        int,
  revision_note   text,
  created_at      timestamptz default now()
);

-- 7. ACTIVITY LOG
create table if not exists activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  emoji       text,
  description text not null,
  created_at  timestamptz default now()
);

-- 8. TRANSACTIONS
create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id),
  type        text check (type in ('deposit','withdrawal','escrow_lock','release')),
  amount      numeric(12,2) not null,
  description text,
  created_at  timestamptz default now()
);

-- ── Row Level Security ──────────────────────────────────────
alter table profiles             enable row level security;
alter table contracts            enable row level security;
alter table escrow_accounts      enable row level security;
alter table conversations        enable row level security;
alter table messages             enable row level security;
alter table milestone_submissions enable row level security;
alter table activity_log         enable row level security;
alter table transactions         enable row level security;

-- Profiles: users can read all (for trust engine), write own
create policy "Profiles are viewable by all authenticated users"
  on profiles for select to authenticated using (true);
create policy "Users can update own profile"
  on profiles for update to authenticated using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert to authenticated with check (auth.uid() = id);

-- Contracts: parties can view/create
create policy "Contract parties can view"
  on contracts for select to authenticated
  using (auth.uid() = freelancer_id or auth.uid() = client_id);
create policy "Authenticated users can create contracts"
  on contracts for insert to authenticated with check (true);
create policy "Contract parties can update"
  on contracts for update to authenticated
  using (auth.uid() = freelancer_id or auth.uid() = client_id);

-- Escrow
create policy "Escrow parties can view"
  on escrow_accounts for select to authenticated
  using (auth.uid() = freelancer_id or auth.uid() = client_id);
create policy "Authenticated can create escrow"
  on escrow_accounts for insert to authenticated with check (true);
create policy "Escrow parties can update"
  on escrow_accounts for update to authenticated
  using (auth.uid() = freelancer_id or auth.uid() = client_id);

-- Conversations
create policy "Conversation participants can view"
  on conversations for select to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Authenticated can create conversations"
  on conversations for insert to authenticated with check (true);

-- Messages
create policy "Conversation participants can view messages"
  on messages for select to authenticated
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
      and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
    )
  );
create policy "Authenticated can send messages"
  on messages for insert to authenticated with check (true);
create policy "Recipients can mark as read"
  on messages for update to authenticated
  using (auth.uid() = recipient_id);

-- Milestones
create policy "Milestone parties can view"
  on milestone_submissions for select to authenticated
  using (auth.uid() = freelancer_id or auth.uid() = client_id);
create policy "Authenticated can create milestones"
  on milestone_submissions for insert to authenticated with check (true);
create policy "Client can update milestone status"
  on milestone_submissions for update to authenticated
  using (auth.uid() = client_id);

-- Activity log
create policy "Users see own activity"
  on activity_log for select to authenticated using (auth.uid() = user_id);
create policy "Authenticated can log activity"
  on activity_log for insert to authenticated with check (true);

-- Transactions
create policy "Users see own transactions"
  on transactions for select to authenticated using (auth.uid() = user_id);
create policy "Authenticated can create transactions"
  on transactions for insert to authenticated with check (true);

-- ── Storage bucket for chat files ──────────────────────────
-- Run this separately in the Storage section OR via SQL:
-- insert into storage.buckets (id, name, public, file_size_limit)
-- values ('chat-files', 'chat-files', true, 2147483648); -- 2GB limit
