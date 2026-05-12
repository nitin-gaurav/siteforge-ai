# AI Website Builder

A full-stack AI website builder with React, Vite, Tailwind, Zustand, Node.js, Express, Supabase auth/database, and Gemini-powered generation.

## Structure

```text
client/
  src/components/editor
  src/components/preview
  src/components/sections
  src/components/ui
  src/pages/auth
  src/pages/dashboard
  src/pages/editor
  src/hooks
  src/store
  src/services
server/
  routes
  controllers
  services/gemini
  middleware
```

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Copy environment files:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

3. Fill in Supabase and Gemini values.

4. Run both apps:

```bash
npm run dev
```

Client: `http://localhost:5173`

Server: `http://localhost:4000`

## Supabase Tables

Create a `projects` table:

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  prompt text default '',
  sections jsonb not null default '[]'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table projects enable row level security;

create policy "Users can read their projects"
on projects for select
using (auth.uid() = user_id);

create policy "Users can insert their projects"
on projects for insert
with check (auth.uid() = user_id);

create policy "Users can update their projects"
on projects for update
using (auth.uid() = user_id);

create policy "Users can delete their projects"
on projects for delete
using (auth.uid() = user_id);
```
