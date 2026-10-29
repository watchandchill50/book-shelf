-- ─────────────────────────────────────────────────────────────
-- Book shelf: likes + comments
-- Run this once in Supabase: Dashboard > SQL Editor > New query > Run.
-- Then enable anonymous sign-ins:
--   Authentication > Sign In / Providers > "Allow anonymous sign-ins".
-- ─────────────────────────────────────────────────────────────

-- LIKES: one row per (book, visitor). Primary key stops double-likes.
create table if not exists public.likes (
  book_id    text        not null check (char_length(book_id) between 1 and 100),
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (book_id, user_id)
);

alter table public.likes enable row level security;

drop policy if exists "Anyone can read likes" on public.likes;
create policy "Anyone can read likes"
  on public.likes for select
  using (true);

drop policy if exists "Visitors like as themselves" on public.likes;
create policy "Visitors like as themselves"
  on public.likes for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Visitors remove their own like" on public.likes;
create policy "Visitors remove their own like"
  on public.likes for delete to authenticated
  using (user_id = auth.uid());


-- COMMENTS
create table if not exists public.comments (
  id         uuid        primary key default gen_random_uuid(),
  book_id    text        not null check (char_length(book_id) between 1 and 100),
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  name       text        not null check (char_length(btrim(name)) between 1 and 40),
  body       text        not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists comments_book_created_idx
  on public.comments (book_id, created_at desc);

alter table public.comments enable row level security;

drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments"
  on public.comments for select
  using (true);

drop policy if exists "Visitors comment as themselves" on public.comments;
create policy "Visitors comment as themselves"
  on public.comments for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Visitors delete their own comments" on public.comments;
create policy "Visitors delete their own comments"
  on public.comments for delete to authenticated
  using (user_id = auth.uid());

-- No update policy: comments can't be edited after posting.
-- To moderate, delete rows in Table Editor > comments (the dashboard
-- bypasses these rules), or run:
--   delete from public.comments where id = '...';
