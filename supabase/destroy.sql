--Drop Tables
drop table if exists public.reports cascade;
drop table if exists public.match_exposures cascade;
drop table if exists public.votes cascade;
drop table if exists public.user_known_characters cascade;
drop table if exists public.characters cascade;
drop table if exists public.profiles cascade;

--Drop Custom Types
drop type if exists public.battle_category cascade;
drop type if exists public.known_source cascade;
drop type if exists public.report_reason cascade;

--Drop Custom Functions/Triggers
drop function if exists public.handle_new_user cascade;
drop function if exists public.submit_votes_batch cascade;
