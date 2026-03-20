# Collectica — Setup Guide

Get Collectica running in about 10 minutes.

---

## Step 1: Create a Supabase Project (Free)

1. Go to **https://supabase.com** → click **Start your project**
2. Sign in with GitHub or email
3. Click **New Project** and fill in:
   - **Name**: collectica
   - **Database password**: create a strong one and save it
   - **Region**: West EU or US East (closest to Nigeria)
4. Click **Create new project** — takes ~1 minute

---

## Step 2: Run the Database Schema

1. In Supabase dashboard → **SQL Editor** → **New query**
2. Open `supabase/schema.sql` from this project folder
3. Copy the entire contents → paste into the editor → click **Run**
4. You should see: `Success. No rows returned.`

This creates all tables, security rules, realtime subscriptions, and the 2GB file storage bucket.

---

## Step 3: Get Your API Keys

Supabase dashboard → **Settings** → **API**

Copy:
- **Project URL** — `https://xxxxxxxx.supabase.co`
- **anon / public key** — the long `eyJ...` string

---

## Step 4: Create Your .env File

In the collectica/ folder, create a file named `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Step 5: Install and Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Step 6: Disable Email Confirmation (for testing)

Supabase → Authentication → Settings → **uncheck** "Enable email confirmations"

This lets you sign up and log in instantly without needing to verify an email.

---

## Step 7: Deploy to Vercel

```bash
npm install -g vercel
vercel
```

In Vercel → your project → Settings → Environment Variables:
Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

---

## Troubleshooting

- **"relation does not exist"** → Run schema.sql in SQL Editor
- **Login fails after signup** → Disable email confirmation (Step 6)
- **Files not uploading** → Check Storage → chat-files bucket exists
- **Real-time not working** → Supabase → Database → Replication → confirm messages table is in supabase_realtime

