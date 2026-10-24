-- KickstartKit — initial schema
-- Tables, constraints, indexes, RLS policies, signup trigger, and storage buckets.
--
-- Security model
--   * Agency users authenticate with Supabase Auth and can only touch rows in
--     their own workspace (enforced by RLS below).
--   * Clients never authenticate with Supabase. Token-based onboarding routes
--     run on the server with the service-role key, which bypasses RLS, and are
--     responsible for scoping every query to the project behind the token.
--   * The anon role gets no table access at all.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MVP: exactly one workspace per user.
create unique index workspaces_owner_id_key on public.workspaces (owner_id);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  full_name text check (char_length(full_name) <= 120),
  created_at timestamptz not null default now()
);

create index profiles_workspace_id_idx on public.profiles (workspace_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_name text not null check (char_length(client_name) between 1 and 200),
  project_name text not null check (char_length(project_name) between 1 and 200),
  description text check (char_length(description) <= 2000),
  status text not null default 'draft'
    check (status in ('draft', 'awaiting_client', 'in_progress', 'ready', 'archived')),
  due_date date,
  readiness_percentage integer not null default 0
    check (readiness_percentage between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_workspace_id_idx on public.projects (workspace_id);
create index projects_workspace_status_idx on public.projects (workspace_id, status);

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  file_name text check (char_length(file_name) <= 255),
  -- Null for pasted text (nothing stored in Storage).
  file_path text,
  file_type text not null check (file_type in ('pdf', 'docx', 'txt', 'pasted_text')),
  raw_text text,
  extraction_status text not null default 'uploaded'
    check (extraction_status in ('uploaded', 'processing', 'extracted', 'failed')),
  created_at timestamptz not null default now()
);

create index source_documents_project_id_idx on public.source_documents (project_id);

create table public.onboarding_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 2000),
  item_type text not null
    check (item_type in ('asset', 'access', 'approval', 'information', 'file', 'decision')),
  input_type text not null
    check (input_type in ('file_upload', 'text', 'url', 'confirmation')),
  required boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'complete')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index onboarding_items_project_sort_idx on public.onboarding_items (project_id, sort_order);

create table public.client_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  -- Random, URL-safe, high-entropy secret generated server-side.
  token text not null unique check (char_length(token) >= 32),
  client_email text check (client_email is null or char_length(client_email) <= 254),
  expires_at timestamptz not null default (now() + interval '30 days'),
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index client_links_project_id_idx on public.client_links (project_id);
-- At most one live (non-revoked) link per project. Regenerating revokes the old one.
create unique index client_links_one_active_per_project
  on public.client_links (project_id) where not revoked;

create table public.client_submissions (
  id uuid primary key default gen_random_uuid(),
  onboarding_item_id uuid not null references public.onboarding_items (id) on delete cascade,
  client_link_id uuid references public.client_links (id) on delete set null,
  response_text text check (char_length(response_text) <= 10000),
  file_path text,
  file_name text check (char_length(file_name) <= 255),
  note text check (char_length(note) <= 2000),
  submitted_at timestamptz not null default now()
);

create index client_submissions_item_idx on public.client_submissions (onboarding_item_id);
create index client_submissions_link_idx on public.client_submissions (client_link_id);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  client_link_id uuid references public.client_links (id) on delete set null,
  sent_at timestamptz not null default now(),
  channel text not null default 'email' check (channel in ('email')),
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error_message text check (char_length(error_message) <= 2000)
);

create index reminders_project_id_idx on public.reminders (project_id, sent_at desc);
create index reminders_client_link_id_idx on public.reminders (client_link_id);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text check (plan in ('starter', 'agency')),
  status text not null default 'trialing' check (
    status in (
      'trialing', 'active', 'past_due', 'canceled', 'incomplete',
      'incomplete_expired', 'unpaid', 'paused'
    )
  ),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at triggers
create trigger workspaces_set_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger onboarding_items_set_updated_at before update on public.onboarding_items
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Ownership helpers (security definer so policies don't recurse through RLS)
-- ---------------------------------------------------------------------------

create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.workspaces where owner_id = (select auth.uid()) limit 1;
$$;

create or replace function public.owns_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.workspace_id = public.current_workspace_id()
  );
$$;

create or replace function public.owns_onboarding_item(p_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.onboarding_items i
    join public.projects p on p.id = i.project_id
    where i.id = p_item_id
      and p.workspace_id = public.current_workspace_id()
  );
$$;

revoke all on function public.current_workspace_id() from public, anon;
revoke all on function public.owns_project(uuid) from public, anon;
revoke all on function public.owns_onboarding_item(uuid) from public, anon;
grant execute on function public.current_workspace_id() to authenticated;
grant execute on function public.owns_project(uuid) to authenticated;
grant execute on function public.owns_onboarding_item(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.source_documents enable row level security;
alter table public.onboarding_items enable row level security;
alter table public.client_links enable row level security;
alter table public.client_submissions enable row level security;
alter table public.reminders enable row level security;
alter table public.subscriptions enable row level security;

-- Defense in depth: the anon role (unauthenticated browsers) gets nothing.
revoke all on
  public.workspaces, public.profiles, public.projects, public.source_documents,
  public.onboarding_items, public.client_links, public.client_submissions,
  public.reminders, public.subscriptions
from anon;

-- workspaces: owner can read and rename. Created by the signup trigger only.
revoke insert, update, delete on public.workspaces from authenticated;
grant update (name) on public.workspaces to authenticated;

create policy "workspaces: owner can read" on public.workspaces
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "workspaces: owner can rename" on public.workspaces
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- profiles: user can read and edit their own name. Created by the signup trigger.
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

create policy "profiles: user can read own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: user can update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- projects: full CRUD inside own workspace.
create policy "projects: workspace can read" on public.projects
  for select to authenticated
  using (workspace_id = (select public.current_workspace_id()));

create policy "projects: workspace can insert" on public.projects
  for insert to authenticated
  with check (workspace_id = (select public.current_workspace_id()));

create policy "projects: workspace can update" on public.projects
  for update to authenticated
  using (workspace_id = (select public.current_workspace_id()))
  with check (workspace_id = (select public.current_workspace_id()));

create policy "projects: workspace can delete" on public.projects
  for delete to authenticated
  using (workspace_id = (select public.current_workspace_id()));

-- source_documents: full CRUD on own projects.
create policy "source_documents: workspace can read" on public.source_documents
  for select to authenticated using (public.owns_project(project_id));
create policy "source_documents: workspace can insert" on public.source_documents
  for insert to authenticated with check (public.owns_project(project_id));
create policy "source_documents: workspace can update" on public.source_documents
  for update to authenticated
  using (public.owns_project(project_id))
  with check (public.owns_project(project_id));
create policy "source_documents: workspace can delete" on public.source_documents
  for delete to authenticated using (public.owns_project(project_id));

-- onboarding_items: full CRUD on own projects.
create policy "onboarding_items: workspace can read" on public.onboarding_items
  for select to authenticated using (public.owns_project(project_id));
create policy "onboarding_items: workspace can insert" on public.onboarding_items
  for insert to authenticated with check (public.owns_project(project_id));
create policy "onboarding_items: workspace can update" on public.onboarding_items
  for update to authenticated
  using (public.owns_project(project_id))
  with check (public.owns_project(project_id));
create policy "onboarding_items: workspace can delete" on public.onboarding_items
  for delete to authenticated using (public.owns_project(project_id));

-- client_links: agency can create, read and revoke links on own projects. Never delete.
revoke delete on public.client_links from authenticated;

create policy "client_links: workspace can read" on public.client_links
  for select to authenticated using (public.owns_project(project_id));
create policy "client_links: workspace can insert" on public.client_links
  for insert to authenticated with check (public.owns_project(project_id));
create policy "client_links: workspace can update" on public.client_links
  for update to authenticated
  using (public.owns_project(project_id))
  with check (public.owns_project(project_id));

-- client_submissions: written only by token-authenticated server routes
-- (service role). Agency can read submissions for own projects.
revoke insert, update, delete on public.client_submissions from authenticated;

create policy "client_submissions: workspace can read" on public.client_submissions
  for select to authenticated using (public.owns_onboarding_item(onboarding_item_id));

-- reminders: written only by the server (service role). Agency can read the log.
revoke insert, update, delete on public.reminders from authenticated;

create policy "reminders: workspace can read" on public.reminders
  for select to authenticated using (public.owns_project(project_id));

-- subscriptions: written only by the Stripe webhook (service role).
revoke insert, update, delete on public.subscriptions from authenticated;

create policy "subscriptions: workspace can read" on public.subscriptions
  for select to authenticated
  using (workspace_id = (select public.current_workspace_id()));

-- ---------------------------------------------------------------------------
-- Signup: create the default workspace + profile atomically with the auth user
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text;
  v_workspace_name text;
  v_workspace_id uuid;
begin
  -- raw_user_meta_data is user-supplied: trim, bound, and fall back safely.
  v_full_name := left(nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''), 120);
  v_workspace_name := left(
    coalesce(
      nullif(btrim(coalesce(new.raw_user_meta_data ->> 'workspace_name', '')), ''),
      'My workspace'
    ),
    120
  );

  insert into public.workspaces (owner_id, name)
  values (new.id, v_workspace_name)
  returning id into v_workspace_id;

  insert into public.profiles (id, workspace_id, full_name)
  values (new.id, v_workspace_id, v_full_name);

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Storage
--   Object paths always start with the workspace id:
--     source-documents/{workspace_id}/{project_id}/{uuid}.{ext}
--     client-uploads/{workspace_id}/{project_id}/{item_id}/{uuid}.{ext}
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'source-documents', 'source-documents', false, 10485760, -- 10 MB
    array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  ),
  (
    'client-uploads', 'client-uploads', false, 52428800, -- 50 MB
    null -- MIME allow-list enforced in the app (lib/validation) before upload
  )
on conflict (id) do nothing;

create policy "source-documents: workspace can read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'source-documents'
    and (storage.foldername(name))[1] = (select public.current_workspace_id())::text
  );

create policy "source-documents: workspace can upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'source-documents'
    and (storage.foldername(name))[1] = (select public.current_workspace_id())::text
  );

create policy "source-documents: workspace can delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'source-documents'
    and (storage.foldername(name))[1] = (select public.current_workspace_id())::text
  );

-- Client uploads are written by the server (service role) after token checks.
-- Agency can read (for signed download URLs) and delete their own.
create policy "client-uploads: workspace can read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'client-uploads'
    and (storage.foldername(name))[1] = (select public.current_workspace_id())::text
  );

create policy "client-uploads: workspace can delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'client-uploads'
    and (storage.foldername(name))[1] = (select public.current_workspace_id())::text
  );
