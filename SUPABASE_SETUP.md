# Collectica — Supabase Setup Guide

## Step 1: Create Supabase Account
1. Go to https://supabase.com and click "Start for free"
2. Sign in with GitHub or email
3. Click "New project"
4. Name it "collectica", choose a strong DB password, pick region closest to Nigeria (eu-west-1 or us-east-1)
5. Wait ~2 minutes for the project to spin up

## Step 2: Get Your Keys
1. In your Supabase dashboard, go to Settings > API
2. Copy "Project URL" → paste as VITE_SUPABASE_URL in your .env
3. Copy "anon public" key → paste as VITE_SUPABASE_ANON_KEY in your .env

## Step 3: Create .env file
```
cp .env.example .env
```
Then fill in your keys.

## Step 4: Run the Database Schema
1. In Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New query"
3. Paste and run this SQL:

```sql
-- Profiles table (linked to Supabase Auth)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text check (role in ('freelancer', 'client')) not null,
  skill text,
  location text,
  company text,
  purpose text,
  bio text,
  trust_score integer default 70,
  wallet_balance bigint default 0,
  created_at timestamptz default now()
);

-- Messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid,
  sender_id uuid references profiles(id) on delete cascade,
  content text,
  type text default 'text',
  file_url text,
  file_name text,
  file_size bigint,
  read boolean default false,
  created_at timestamptz default now()
);

-- Activity feed table
create table if not exists activity_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  emoji text default '📋',
  text text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table messages enable row level security;
alter table activity_feed enable row level security;

-- Profiles: users can read all profiles (for Trust Engine), write own
create policy "Public profiles are viewable" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Messages: users can read and write messages
create policy "Users can view messages" on messages for select using (auth.uid() = sender_id);
create policy "Users can insert messages" on messages for insert with check (auth.uid() = sender_id);

-- Activity: users see own activity
create policy "Users see own activity" on activity_feed for select using (auth.uid() = user_id);
create policy "Users insert own activity" on activity_feed for insert with check (auth.uid() = user_id);
```

## Step 5: Enable Realtime
1. In Supabase, go to Database > Replication
2. Enable replication for the `messages` table
3. This powers the real-time chat

## Step 6: Create Storage Bucket
1. Go to Storage in the left sidebar
2. Click "New bucket"
3. Name it `deliverables`
4. Set it to Public
5. This enables file sharing up to 2GB per file (Supabase free tier allows 1GB total storage; upgrade for more)

## Step 7: Run the App
```bash
npm install
npm run dev
```

## Step 8: Deploy to Vercel
1. Push your code to GitHub
2. Go to https://vercel.com and import your repo
3. Add your env variables in Vercel dashboard (Settings > Environment Variables)
4. Deploy!

---

## Notes
- Email confirmation is ON by default in Supabase. To skip for demo: go to Auth > Settings and disable "Enable email confirmations"
- The Trust Engine seeds with demo users if no real users exist yet
- Wallet balance is stored in the DB but is a demo value (not real money)
