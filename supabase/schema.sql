--=====================EXTENSIONS======================================= 
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

--======================================= CUSTOM TYPES & ENUMS ======================================= 
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'battle_category') then
    create type battle_category as enum (
      'strength', 'speed', 'intelligence', 'durability', 'power', 'combat', 'overall'
    );
  end if;
  
  if not exists (select 1 from pg_type where typname = 'known_source') then
    create type known_source as enum (
      'swipe_onboarding', 'manual_search', 'organic_behavior'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'report_reason') then
    create type report_reason as enum (
      'duplicate_entry',
      'joke_character',
      'wrong_version',
      'character_does_not_exist',
      'copyright_image',
      'inappropriate_image'
    );
  end if;
end $$;

--=======================================TABLES======================================= 

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  vote_limit integer not null default 10,
  upload_limit integer not null default 5,
  last_reset_date date not null default current_date,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz    
);

-- Characters
create table if not exists public.characters (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  series text not null,
  version text,
  image_url text not null,
  image_public_id text,
  description text not null default '',
  elo integer not null default 1500,
  categories battle_category[] not null default '{}',
  submitted_by uuid references auth.users(id) on delete set null,
  approved boolean not null default false,
  inappropriate_flagged boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

-- User Known Characters
create table if not exists public.user_known_characters (
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  source known_source not null default 'swipe_onboarding',
  created_at timestamptz not null default now(),
  primary key (user_id, character_id)
);

-- Votes
create table if not exists public.votes (
  id uuid primary key default uuid_generate_v4(),
  voter_id uuid not null references auth.users(id) on delete cascade,
  winner_id uuid not null references characters(id) on delete cascade,
  loser_id uuid references characters(id) on delete cascade,
  skipped boolean not null default false,
  created_at timestamptz not null default now()
);

-- Match Exposures
create table if not exists public.match_exposures (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_a_id uuid not null references characters(id) on delete cascade,
  character_b_id uuid not null references characters(id) on delete cascade,
  shown_at timestamptz not null default now()
);

-- Reports
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  reason report_reason not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

--=======================================INDICES======================================= 
create index if not exists idx_characters_elo on characters(elo desc) where approved = true and is_deleted = false;
create index if not exists idx_characters_approved on characters(approved) where is_deleted = false;
create index if not exists idx_characters_submitted_by on characters(submitted_by);
create unique index if not exists idx_user_character_unique on user_known_characters(user_id, character_id);
create index if not exists idx_known_by_user on user_known_characters(user_id);
create index if not exists idx_votes_winner on votes(winner_id);
create index if not exists idx_votes_loser on votes(loser_id);
create index if not exists idx_votes_voter on votes(voter_id);
create index if not exists idx_exposures_user on match_exposures(user_id, shown_at desc);
create index if not exists idx_reports_character on reports(character_id);
create index if not exists idx_reports_unresolved on reports(resolved) where resolved = false;

--=======================================ROW LEVEL SECURITY (RLS) POLICIES
alter table profiles enable row level security;
alter table characters enable row level security;
alter table user_known_characters enable row level security;
alter table votes enable row level security;
alter table match_exposures enable row level security;
alter table reports enable row level security;

-- Profiles
create policy "profiles_select" on profiles for select using (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Characters
create policy "characters_select" on characters for select using ((approved = true and is_deleted = false) or auth.uid() = submitted_by);
create policy "characters_insert" on characters for insert with check (auth.uid() is not null and (select upload_limit from profiles where id = auth.uid()) > 0);
create policy "characters_update_elo" on characters for update using (true);

-- User Known Characters
create policy "known_select" on user_known_characters for select using (auth.uid() = user_id);
create policy "known_insert" on user_known_characters for insert with check (auth.uid() = user_id);
create policy "known_update" on user_known_characters for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "known_delete" on user_known_characters for delete using (auth.uid() = user_id);

-- Votes
create policy "votes_select" on votes for select using (true);
create policy "votes_insert" on votes for insert with check (auth.uid() = voter_id);

-- Match Exposures
create policy "exposures_select" on match_exposures for select using (auth.uid() = user_id);
create policy "exposures_insert" on match_exposures for insert with check (auth.uid() = user_id);

-- Reports
create policy "reports_insert" on reports for insert with check (auth.uid() = reporter_id);
create policy "reports_select" on reports for select using (auth.uid() = reporter_id);

-- ============================================================FUNCTIONS============================================================

-- Automatic Profile Creation
create or replace function public.handle_new_user()
returns trigger as $$
declare
  meta_username text;
  meta_display_name text;
begin
  meta_username := (new.raw_user_meta_data->>'username');
  meta_display_name := (new.raw_user_meta_data->>'display_name');

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(meta_username, split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4)),
    coalesce(meta_display_name, split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Random Character Query Matchmaking
create or replace function get_random_characters(excluded_ids uuid[], limit_count int)
returns setof characters
language sql
security definer
as $$
  select * from characters
  where approved = true
    and is_deleted = false
    and (excluded_ids is null or not (id = any(excluded_ids)))
    and not exists (
      select 1 from user_known_characters 
      where user_id = auth.uid() 
      and character_id = characters.id
    )
  order by random()
  limit limit_count;
$$;

-- Vote Engine (Batch Processor & ELO Evaluator)
create or replace function submit_votes_batch(payload jsonb)
returns void as $$
declare
  vote record;
  batch_size int;
  current_limit int;
  already_voted boolean;
  
  winner_elo float;
  loser_elo float;
  expected_winner float;
  k_factor int := 32;
  winner_delta float;
  loser_delta float;
begin
  batch_size := jsonb_array_length(payload);

  select vote_limit into current_limit 
  from profiles 
  where id = auth.uid() 
  for update;

  if batch_size > current_limit then
    raise exception 'Batch size (%) exceeds remaining vote limit (%).', batch_size, current_limit;
  end if;

  for vote in select * from jsonb_to_recordset(payload) as x(
    voter_id uuid, winner_id uuid, loser_id uuid, skipped boolean
  ) loop
  
    select exists (
      select 1 
      from votes 
      where voter_id = auth.uid()
        and (
          (winner_id = vote.winner_id and loser_id = vote.loser_id) or
          (winner_id = vote.loser_id and loser_id = vote.winner_id)
        )
    ) into already_voted;

    if already_voted then
      continue;
    end if;

    insert into votes (voter_id, winner_id, loser_id, skipped)
    values (vote.voter_id, vote.winner_id, vote.loser_id, vote.skipped);
    
    if not vote.skipped and vote.loser_id is not null then
      select elo into winner_elo from characters where id = vote.winner_id;
      select elo into loser_elo from characters where id = vote.loser_id;

      expected_winner := 1.0 / (1.0 + power(10.0, (loser_elo - winner_elo) / 400.0));
      winner_delta := k_factor * (1.0 - expected_winner);
      loser_delta := -winner_delta;

      update characters set elo = elo + winner_delta where id = vote.winner_id;
      update characters set elo = elo + loser_delta where id = vote.loser_id;
    end if;
  end loop;
  
  update profiles 
  set vote_limit = current_limit - batch_size 
  where id = auth.uid();
end;
$$ language plpgsql security definer;

-- ====================DAILY RESET CRON============================================================
create or replace function reset_daily_limits()
returns void as $$
begin
  update profiles
  set 
    vote_limit = greatest(5, vote_limit),
    upload_limit = greatest(3, upload_limit),
    last_reset_date = current_date    
  where 
    last_reset_date < current_date;
end;
$$ language plpgsql security definer;

do $$
begin
  perform cron.unschedule('daily-profile-limits-reset');
exception when others then
end $$;

select cron.schedule(
  'daily-profile-limits-reset',
  '0 0 * * *', 
  $$ select reset_daily_limits(); $$
);

select reset_daily_limits();