-- SnapLoop: profile customization + algorithm prefs
-- Run once in Supabase SQL Editor

alter table public.profiles
  add column if not exists style_prefs jsonb not null default '{}'::jsonb;

comment on column public.profiles.style_prefs is
  'Cute profile vibe, cover, interests, and feed algorithm prefs';
