-- ═════════════════════════════════════════════════════════════
--  موقع خديجه فاروق المطري — database setup
--  Run in Supabase: Dashboard > SQL Editor > New query > paste all > Run.
--  Safe to run more than once, and safe on the old book-shelf database
--  (it keeps your existing likes/comments tables and adds what's new).
-- ═════════════════════════════════════════════════════════════


-- ─── Admins: who may publish ────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
-- (no policies: nobody can read or change this table from the website)

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;


-- ─── Posts: every kind of content in one table ──────────────
-- type:  article (مقالة) · prose (نثر) · poem (شعر) · review (قراءة)
--        quote (اقتباس) · book (كتاب) · photo (صورة)
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('article','prose','poem','review','quote','book','photo')),
  title        text not null default '' check (char_length(title) <= 300),
  body         text not null default '' check (char_length(body) <= 200000),
  excerpt      text not null default '' check (char_length(excerpt) <= 1000),
  cover_url    text,
  file_url     text,
  file_name    text,
  file_size    bigint,
  link_url     text,
  ref_author   text,          -- quote: who said it · review: the writer · book: its author
  ref_source   text,          -- quote: source · review: the work discussed
  book_kind    text check (book_kind in ('mine','recommended')),
  category     text,
  tags         text[] not null default '{}',
  status       text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz not null default now(),
  featured     boolean not null default false,
  downloads    integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists posts_type_published_idx on public.posts (type, published_at desc);

alter table public.posts enable row level security;

drop policy if exists "Visitors read published posts" on public.posts;
create policy "Visitors read published posts"
  on public.posts for select
  using ((status = 'published' and published_at <= now()) or public.is_admin());

drop policy if exists "Admin writes posts" on public.posts;
create policy "Admin writes posts"
  on public.posts for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- Counts a download without letting visitors edit posts.
create or replace function public.record_download(post uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts set downloads = downloads + 1
  where id = post and status = 'published' and file_url is not null;
$$;
grant execute on function public.record_download(uuid) to anon, authenticated;


-- ─── Site settings (about page, tagline, links) ─────────────
create table if not exists public.settings (
  id    text primary key default 'site' check (id = 'site'),
  data  jsonb not null default '{}'::jsonb
);
insert into public.settings (id) values ('site') on conflict do nothing;

alter table public.settings enable row level security;

drop policy if exists "Anyone reads settings" on public.settings;
create policy "Anyone reads settings" on public.settings for select using (true);

drop policy if exists "Admin writes settings" on public.settings;
create policy "Admin writes settings"
  on public.settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());


-- ─── Likes (book_id holds the post id) ───────────────────────
create table if not exists public.likes (
  book_id    text        not null check (char_length(book_id) between 1 and 100),
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (book_id, user_id)
);
alter table public.likes enable row level security;

drop policy if exists "Anyone can read likes" on public.likes;
create policy "Anyone can read likes" on public.likes for select using (true);

drop policy if exists "Visitors like as themselves" on public.likes;
create policy "Visitors like as themselves"
  on public.likes for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Visitors remove their own like" on public.likes;
create policy "Visitors remove their own like"
  on public.likes for delete to authenticated using (user_id = auth.uid());


-- ─── Comments, with author replies ───────────────────────────
create table if not exists public.comments (
  id         uuid        primary key default gen_random_uuid(),
  book_id    text        not null check (char_length(book_id) between 1 and 100),
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  name       text        not null check (char_length(btrim(name)) between 1 and 40),
  body       text        not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table public.comments add column if not exists is_author boolean not null default false;
alter table public.comments add column if not exists parent_id uuid references public.comments (id) on delete cascade;
create index if not exists comments_book_created_idx on public.comments (book_id, created_at desc);

alter table public.comments enable row level security;

drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments" on public.comments for select using (true);

-- Visitors: only plain comments, as themselves. Only the admin can post
-- as the author ("الكاتبة") or reply under a comment.
drop policy if exists "Visitors comment as themselves" on public.comments;
create policy "Visitors comment as themselves"
  on public.comments for insert to authenticated
  with check (
    user_id = auth.uid()
    and ((is_author = false and parent_id is null) or public.is_admin())
  );

drop policy if exists "Visitors delete their own comments" on public.comments;
create policy "Visitors delete their own comments"
  on public.comments for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());


-- ─── File storage: images and PDFs ───────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)   -- 50 MB per file
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "Anyone reads media" on storage.objects;
create policy "Anyone reads media"
  on storage.objects for select using (bucket_id = 'media');

drop policy if exists "Admin uploads media" on storage.objects;
create policy "Admin uploads media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admin updates media" on storage.objects;
create policy "Admin updates media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admin deletes media" on storage.objects;
create policy "Admin deletes media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());


-- ─────────────────────────────────────────────────────────────
-- LAST STEP — make yourself the admin:
--   1. Authentication > Users > Add user > Create new user
--      (your email + a strong password, tick "Auto Confirm User")
--   2. Run this line with your email:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'your@email.com'
--   on conflict do nothing;
-- ─────────────────────────────────────────────────────────────

-- refresh the API so the new tables are visible right away
notify pgrst, 'reload schema';