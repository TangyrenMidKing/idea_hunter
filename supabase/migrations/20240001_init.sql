-- IdeaRank schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query

create table if not exists public.rooms (
  id          text        primary key,
  description text        not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.ideas (
  id          text        primary key,
  room_id     text        not null references public.rooms(id) on delete cascade,
  title       text        not null,
  description text        not null default '',
  added_by    text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists ideas_room_id_idx on public.ideas(room_id);

create table if not exists public.votes (
  id           text        primary key,
  room_id      text        not null references public.rooms(id) on delete cascade,
  voter_name   text        not null,
  -- JSONB object: { [idea_id]: token_count }
  allocations  jsonb       not null default '{}',
  submitted_at timestamptz not null default now(),
  unique (room_id, voter_name)
);

create index if not exists votes_room_id_idx on public.votes(room_id);

-- Row Level Security
-- The app uses the anon key, so we allow full public access.
-- Tighten these policies if you add auth later.

alter table public.rooms  enable row level security;
alter table public.ideas  enable row level security;
alter table public.votes  enable row level security;

create policy "public read rooms"  on public.rooms  for select using (true);
create policy "public insert rooms" on public.rooms for insert with check (true);

create policy "public read ideas"   on public.ideas  for select using (true);
create policy "public insert ideas"  on public.ideas  for insert with check (true);
create policy "public delete ideas"  on public.ideas  for delete using (true);

create policy "public read votes"   on public.votes  for select using (true);
create policy "public insert votes" on public.votes  for insert with check (true);
create policy "public update votes" on public.votes  for update using (true);
