-- RLS / workspace isolation tests. Run with: npm run test:db
begin;
create extension if not exists pgtap with schema extensions;

select plan(26);

-- Two agency users. The signup trigger should create a workspace + profile for each.
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@agency.test',
   '{"full_name":"Alice","workspace_name":"Alice Studio"}', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'bob@agency.test',
   '{"full_name":"  ","workspace_name":""}', 'authenticated', 'authenticated');

select is(
  (select name from public.workspaces where owner_id = '11111111-1111-1111-1111-111111111111'),
  'Alice Studio', 'signup trigger creates named workspace'
);
select is(
  (select name from public.workspaces where owner_id = '22222222-2222-2222-2222-222222222222'),
  'My workspace', 'blank workspace name falls back to default'
);
select is(
  (select full_name from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  null, 'blank full name stored as null'
);
select is(
  (select p.workspace_id from public.profiles p where p.id = '11111111-1111-1111-1111-111111111111'),
  (select w.id from public.workspaces w where w.owner_id = '11111111-1111-1111-1111-111111111111'),
  'profile is linked to the new workspace'
);

-- Seed a project for each workspace (as superuser).
insert into public.projects (id, workspace_id, client_name, project_name)
select 'aaaaaaaa-0000-0000-0000-000000000001', id, 'Acme', 'Acme rebrand'
from public.workspaces where owner_id = '11111111-1111-1111-1111-111111111111';
insert into public.projects (id, workspace_id, client_name, project_name)
select 'bbbbbbbb-0000-0000-0000-000000000001', id, 'Globex', 'Globex launch video'
from public.workspaces where owner_id = '22222222-2222-2222-2222-222222222222';

insert into public.onboarding_items (id, project_id, title, item_type, input_type)
values ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
        'Logo files', 'asset', 'file_upload'),
       ('bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
        'Brand guide', 'asset', 'file_upload');

insert into public.client_links (project_id, token, client_email)
values ('bbbbbbbb-0000-0000-0000-000000000001', repeat('b', 43), 'client@globex.test');

insert into public.client_submissions (onboarding_item_id, response_text)
values ('bbbbbbbb-1111-0000-0000-000000000001', 'secret answer');

insert into public.reminders (project_id, status)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'sent');

select set_config('test.bob_ws',
  (select id::text from public.workspaces where owner_id = '22222222-2222-2222-2222-222222222222'), true);

-- ---------------------------------------------------------------------------
-- Act as Alice
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*)::int from public.workspaces), 1, 'alice sees only her workspace');
select is((select count(*)::int from public.profiles), 1, 'alice sees only her profile');
select is((select count(*)::int from public.projects), 1, 'alice sees only her projects');
select is((select project_name from public.projects), 'Acme rebrand', 'alice sees the right project');
select is((select count(*)::int from public.onboarding_items), 1, 'alice sees only her items');
select is((select count(*)::int from public.client_links), 0, 'alice cannot see bob''s links');
select is((select count(*)::int from public.client_submissions), 0, 'alice cannot see bob''s submissions');
select is((select count(*)::int from public.reminders), 0, 'alice cannot see bob''s reminders');

-- Writes into another workspace are rejected.
select throws_ok(
  $$ insert into public.projects (workspace_id, client_name, project_name)
     values (current_setting('test.bob_ws')::uuid, 'X', 'Hijack') $$,
  '42501', null, 'alice cannot insert a project into bob''s workspace'
);

select lives_ok(
  $$ insert into public.projects (workspace_id, client_name, project_name)
     values (public.current_workspace_id(), 'Initech', 'Initech site') $$,
  'alice can insert a project into her own workspace'
);

update public.projects set project_name = 'pwned' where id = 'bbbbbbbb-0000-0000-0000-000000000001';
delete from public.projects where id = 'bbbbbbbb-0000-0000-0000-000000000001';

select throws_ok(
  $$ update public.projects set workspace_id = current_setting('test.bob_ws')::uuid
     where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  '42501', null, 'alice cannot move her project into bob''s workspace'
);

select throws_ok(
  $$ insert into public.onboarding_items (project_id, title, item_type, input_type)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 'x', 'asset', 'text') $$,
  '42501', null, 'alice cannot add items to bob''s project'
);

select throws_ok(
  $$ insert into public.client_submissions (onboarding_item_id, response_text)
     values ('aaaaaaaa-1111-0000-0000-000000000001', 'forged') $$,
  '42501', null, 'agency users cannot forge client submissions'
);

select throws_ok(
  $$ insert into public.subscriptions (workspace_id, status)
     values (public.current_workspace_id(), 'active') $$,
  '42501', null, 'agency users cannot grant themselves a subscription'
);

select throws_ok(
  $$ update public.profiles set workspace_id = null
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'profile.workspace_id is not user-writable'
);

select lives_ok(
  $$ update public.profiles set full_name = 'Alice B'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  'profile.full_name is user-writable'
);

select throws_ok(
  $$ update public.workspaces set owner_id = '22222222-2222-2222-2222-222222222222' $$,
  '42501', null, 'workspace.owner_id is not user-writable'
);

-- ---------------------------------------------------------------------------
-- Act as anon (an unauthenticated browser)
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok($$ select count(*) from public.projects $$, '42501', null,
  'anon cannot read projects');
select throws_ok($$ select count(*) from public.client_links $$, '42501', null,
  'anon cannot read client links (tokens)');

-- ---------------------------------------------------------------------------
-- Verify as superuser that bob's data survived alice's attempts
-- ---------------------------------------------------------------------------
reset role;

select is(
  (select project_name from public.projects where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  'Globex launch video', 'bob''s project was not modified or deleted by alice'
);

select throws_ok(
  $$ insert into public.client_links (project_id, token)
     values ('bbbbbbbb-0000-0000-0000-000000000001', repeat('c', 43)) $$,
  '23505', null, 'only one active client link per project'
);

select throws_ok(
  $$ insert into public.client_links (project_id, token)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'short') $$,
  '23514', null, 'short tokens are rejected'
);

select * from finish();
rollback;
