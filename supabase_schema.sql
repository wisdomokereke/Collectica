-- ============================================================
-- COLLECTICA — Supabase Schema
-- Paste this entire file into Supabase SQL Editor and run it
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── USERS (profile, extends Supabase auth.users) ───────────
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text check (role in ('freelancer', 'client')) not null,
  avatar_url text,
  bio text,
  skills text[], -- for freelancers
  portfolio_url text, -- for freelancers
  company_name text, -- for clients
  location text,
  signing_key text unique not null default gen_random_uuid()::text,
  signing_pin_hash text, -- hashed 6-digit PIN
  wallet_balance numeric(12, 2) default 0.00,
  trust_score integer default 70,
  total_earned numeric(12, 2) default 0.00,
  total_spent numeric(12, 2) default 0.00,
  contracts_completed integer default 0,
  contracts_abandoned integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── JOBS ───────────────────────────────────────────────────
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  category text not null,
  budget_min numeric(12, 2) not null,
  budget_max numeric(12, 2) not null,
  deadline date,
  status text check (status in ('open', 'in_progress', 'completed', 'cancelled')) default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── CHATS ──────────────────────────────────────────────────
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  client_id uuid references public.users(id) not null,
  freelancer_id uuid references public.users(id) not null,
  contract_id uuid, -- filled in once contract is created
  created_at timestamptz default now(),
  unique(job_id, freelancer_id)
);

-- ── MESSAGES ───────────────────────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete set null,
  content text,
  type text check (type in ('text', 'file', 'image', 'colle', 'system', 'contract_draft')) default 'text',
  file_url text,
  file_name text,
  file_size bigint,
  metadata jsonb, -- for contract drafts, colle responses, etc.
  created_at timestamptz default now()
);

-- ── CONTRACTS ──────────────────────────────────────────────
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) not null,
  job_id uuid references public.jobs(id) not null,
  client_id uuid references public.users(id) not null,
  freelancer_id uuid references public.users(id) not null,
  title text not null,
  scope text not null,
  total_value numeric(12, 2) not null,
  currency text default 'NGN',
  status text check (status in ('draft', 'pending_signatures', 'active', 'completed', 'disputed', 'cancelled')) default 'draft',
  version integer default 1,
  signed_client boolean default false,
  signed_client_at timestamptz,
  signed_freelancer boolean default false,
  signed_freelancer_at timestamptz,
  escrow_funded boolean default false,
  escrow_funded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Update chats to reference contract properly
alter table public.chats add constraint chats_contract_id_fkey
  foreign key (contract_id) references public.contracts(id) on delete set null;

-- ── CONTRACT VERSIONS (git-style history) ──────────────────
create table public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts(id) on delete cascade not null,
  version integer not null,
  scope text not null,
  total_value numeric(12, 2) not null,
  change_summary text,
  snapshot_json jsonb,
  proposed_by uuid references public.users(id),
  signed_client boolean default false,
  signed_freelancer boolean default false,
  created_at timestamptz default now()
);

-- ── MILESTONES ─────────────────────────────────────────────
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts(id) on delete cascade not null,
  title text not null,
  description text,
  amount numeric(12, 2) not null,
  deadline date,
  max_revisions integer default 2,
  revisions_used integer default 0,
  status text check (status in ('pending', 'in_progress', 'submitted', 'revision_requested', 'approved', 'paid')) default 'pending',
  order_index integer not null,
  submitted_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ── TRANSACTIONS ───────────────────────────────────────────
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) not null,
  type text check (type in ('deposit', 'escrow_lock', 'escrow_release', 'withdrawal', 'refund')) not null,
  amount numeric(12, 2) not null,
  balance_after numeric(12, 2),
  description text,
  contract_id uuid references public.contracts(id) on delete set null,
  milestone_id uuid references public.milestones(id) on delete set null,
  status text check (status in ('pending', 'completed', 'failed')) default 'completed',
  created_at timestamptz default now()
);

-- ── REVIEWS ────────────────────────────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts(id) not null,
  reviewer_id uuid references public.users(id) not null,
  reviewee_id uuid references public.users(id) not null,
  score integer check (score between 1 and 5) not null,
  content text,
  source text check (source in ('ai', 'manual')) default 'manual',
  created_at timestamptz default now(),
  unique(contract_id, reviewer_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Ensures users can only see/edit their own data
-- ============================================================

alter table public.users enable row level security;
alter table public.jobs enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_versions enable row level security;
alter table public.milestones enable row level security;
alter table public.transactions enable row level security;
alter table public.reviews enable row level security;

-- Users: anyone can read profiles, only owner can update
create policy "Public profiles are viewable" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Jobs: anyone can read open jobs, only client can create/edit theirs
create policy "Anyone can view open jobs" on public.jobs for select using (true);
create policy "Clients can insert jobs" on public.jobs for insert with check (auth.uid() = client_id);
create policy "Clients can update own jobs" on public.jobs for update using (auth.uid() = client_id);

-- Chats: only participants can see
create policy "Chat participants can view" on public.chats for select using (auth.uid() = client_id or auth.uid() = freelancer_id);
create policy "Freelancers can create chats" on public.chats for insert with check (auth.uid() = freelancer_id);

-- Messages: only chat participants can read/write
create policy "Chat participants can view messages" on public.messages for select
  using (exists (select 1 from public.chats where id = chat_id and (client_id = auth.uid() or freelancer_id = auth.uid())));
create policy "Chat participants can send messages" on public.messages for insert
  with check (exists (select 1 from public.chats where id = chat_id and (client_id = auth.uid() or freelancer_id = auth.uid())));

-- Contracts: only parties involved
create policy "Contract parties can view" on public.contracts for select using (auth.uid() = client_id or auth.uid() = freelancer_id);
create policy "Contract parties can update" on public.contracts for update using (auth.uid() = client_id or auth.uid() = freelancer_id);
create policy "Contract parties can insert" on public.contracts for insert with check (auth.uid() = client_id or auth.uid() = freelancer_id);

-- Contract versions: same as contracts
create policy "Version parties can view" on public.contract_versions for select
  using (exists (select 1 from public.contracts c where c.id = contract_id and (c.client_id = auth.uid() or c.freelancer_id = auth.uid())));
create policy "Version parties can insert" on public.contract_versions for insert
  with check (exists (select 1 from public.contracts c where c.id = contract_id and (c.client_id = auth.uid() or c.freelancer_id = auth.uid())));

-- Milestones: contract parties
create policy "Milestone parties can view" on public.milestones for select
  using (exists (select 1 from public.contracts c where c.id = contract_id and (c.client_id = auth.uid() or c.freelancer_id = auth.uid())));
create policy "Milestone parties can manage" on public.milestones for all
  using (exists (select 1 from public.contracts c where c.id = contract_id and (c.client_id = auth.uid() or c.freelancer_id = auth.uid())));

-- Transactions: owner only
create policy "Own transactions only" on public.transactions for select using (auth.uid() = user_id);
create policy "Own transactions insert" on public.transactions for insert with check (auth.uid() = user_id);

-- Reviews: public read, owner write
create policy "Reviews are public" on public.reviews for select using (true);
create policy "Reviewers can insert" on public.reviews for insert with check (auth.uid() = reviewer_id);

-- ============================================================
-- TRIGGER: auto-update updated_at timestamps
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger on_users_updated before update on public.users for each row execute procedure public.handle_updated_at();
create trigger on_jobs_updated before update on public.jobs for each row execute procedure public.handle_updated_at();
create trigger on_contracts_updated before update on public.contracts for each row execute procedure public.handle_updated_at();

-- ============================================================
-- TRIGGER: create user profile after auth signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'role', 'freelancer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- DONE. Your schema is ready.
-- ============================================================
