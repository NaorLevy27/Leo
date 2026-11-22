-- Leo – Supabase schema. Paste into Supabase › SQL Editor › Run (once).

-- profiles: public display name per user
create table if not exists profiles(
  id uuid primary key references auth.users on delete cascade,
  name text not null default 'שחקן' check (char_length(name) between 1 and 40),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- progress: one row per user, the whole progress map (merged on the client, newest wins per key)
create table if not exists progress(
  user_id uuid primary key references auth.users on delete cascade,
  st jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- comments on any page: item_key = 'i:<item id>' | 'L:<map location id>' | 'g:<guide id>'
create table if not exists comments(
  id uuid primary key default gen_random_uuid(),
  item_key text not null check (char_length(item_key) <= 200),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  parent_id uuid references comments on delete cascade,
  body text not null check (char_length(body) between 2 and 1500),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_key_idx on comments(item_key, created_at);

create table if not exists comment_votes(
  comment_id uuid references comments on delete cascade,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  v smallint not null check (v in (-1,1)),
  primary key(comment_id,user_id)
);

create table if not exists reports(
  id bigserial primary key,
  comment_id uuid references comments on delete cascade,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  reason text check (char_length(reason) <= 300),
  created_at timestamptz not null default now()
);

-- read model used by the site
create or replace view comments_view with (security_invoker = on) as
  select c.id,c.item_key,c.user_id,c.parent_id,c.body,c.created_at,
         p.name, coalesce((select sum(v) from comment_votes w where w.comment_id=c.id),0)::int as score
  from comments c left join profiles p on p.id=c.user_id
  where not c.hidden;

create or replace view comment_counts with (security_invoker = on) as
  select item_key, count(*)::int as n from comments where not hidden group by item_key;

create or replace view leaderboard with (security_invoker = on) as
  select p.id, p.name,
    (select count(*) from comments c where c.user_id=p.id and not c.hidden)::int as comments,
    coalesce((select sum(v) from comment_votes w join comments c on c.id=w.comment_id where c.user_id=p.id),0)::int as likes
  from profiles p order by likes desc, comments desc;

-- ===== Row Level Security =====
alter table profiles enable row level security;
alter table progress enable row level security;
alter table comments enable row level security;
alter table comment_votes enable row level security;
alter table reports enable row level security;

create or replace function is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select coalesce((select is_admin from profiles where id=auth.uid()),false) $$;

drop policy if exists "profiles read" on profiles;      create policy "profiles read" on profiles for select using (true);
drop policy if exists "profiles insert" on profiles;    create policy "profiles insert" on profiles for insert with check (id=auth.uid() and is_admin=false);
drop policy if exists "profiles update" on profiles;    create policy "profiles update" on profiles for update using (id=auth.uid()) with check (id=auth.uid() and is_admin=(select is_admin from profiles where id=auth.uid()));

drop policy if exists "progress own" on progress;       create policy "progress own" on progress for all using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "comments read" on comments;      create policy "comments read" on comments for select using (not hidden or user_id=auth.uid() or is_admin());
drop policy if exists "comments insert" on comments;    create policy "comments insert" on comments for insert with check (user_id=auth.uid() and hidden=false);
drop policy if exists "comments delete" on comments;    create policy "comments delete" on comments for delete using (user_id=auth.uid() or is_admin());
drop policy if exists "comments moderate" on comments;  create policy "comments moderate" on comments for update using (is_admin());

drop policy if exists "votes read" on comment_votes;    create policy "votes read" on comment_votes for select using (true);
drop policy if exists "votes own" on comment_votes;     create policy "votes own" on comment_votes for all using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "reports insert" on reports;      create policy "reports insert" on reports for insert with check (user_id=auth.uid());
drop policy if exists "reports admin" on reports;       create policy "reports admin" on reports for select using (is_admin());

-- simple flood guard: max 20 comments per user per hour
create or replace function comments_rate() returns trigger language plpgsql as $$
begin
  if (select count(*) from comments where user_id=new.user_id and created_at>now()-interval '1 hour')>=20 then
    raise exception 'rate limit';
  end if;
  return new;
end $$;
drop trigger if exists comments_rate on comments;
create trigger comments_rate before insert on comments for each row execute function comments_rate();

-- make yourself admin (after you sign in once):
-- update profiles set is_admin=true where id=(select id from auth.users where email='YOUR@EMAIL');
