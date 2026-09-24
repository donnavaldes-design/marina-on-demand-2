create table if not exists public.voice_usage (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 message_id uuid references public.messages(id) on delete cascade,
 kind text not null check (kind in ('dictation','playback')),
 provider text not null, model text not null,
 status text not null check (status in ('pending','generated','completed','failed')),
 cache_key text unique, storage_path text,
 input_bytes integer, input_characters integer, duration_seconds numeric,
 usage jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.voice_usage enable row level security;
revoke all on public.voice_usage from anon, authenticated;
grant all on public.voice_usage to service_role;
create index if not exists voice_usage_user_created on public.voice_usage(user_id,created_at desc);
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('mod-voice','mod-voice',false,10485760,array['audio/mpeg'])
on conflict (id) do nothing;
