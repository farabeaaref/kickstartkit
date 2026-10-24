-- Source documents + storage isolation tests. Run with: npm run test:db
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email, raw_user_meta_data, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@agency.test', '{"workspace_name":"Alice Studio"}', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'bob@agency.test', '{"workspace_name":"Bob Films"}', 'authenticated', 'authenticated');

select set_config('test.alice_ws',
  (select id::text from public.workspaces where owner_id = '11111111-1111-1111-1111-111111111111'), true);
select set_config('test.bob_ws',
  (select id::text from public.workspaces where owner_id = '22222222-2222-2222-2222-222222222222'), true);

insert into public.projects (id, workspace_id, client_name, project_name)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', current_setting('test.alice_ws')::uuid, 'Acme', 'Acme rebrand'),
  ('bbbbbbbb-0000-0000-0000-000000000001', current_setting('test.bob_ws')::uuid, 'Globex', 'Globex video');

-- Bob already has a stored file and a document row.
insert into storage.objects (bucket_id, name)
values ('source-documents', current_setting('test.bob_ws') || '/bbbbbbbb-0000-0000-0000-000000000001/brief.pdf');
insert into public.source_documents (project_id, file_name, file_path, file_type, raw_text, extraction_status)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'brief.pdf',
        current_setting('test.bob_ws') || '/bbbbbbbb-0000-0000-0000-000000000001/brief.pdf',
        'pdf', 'Bob confidential brief', 'extracted');

-- Data integrity (as superuser)
select throws_ok(
  $$ insert into public.source_documents (project_id, file_name, file_path, file_type, extraction_status)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'x', 'some/path.txt', 'pasted_text', 'extracted') $$,
  '23514', null, 'pasted text cannot have a stored file'
);
select throws_ok(
  $$ insert into public.source_documents (project_id, file_name, file_type, extraction_status)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'x.pdf', 'pdf', 'extracted') $$,
  '23514', null, 'an extracted upload must have a stored file'
);
select lives_ok(
  $$ insert into public.source_documents (project_id, file_name, file_type, extraction_status, extraction_error)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'bad.pdf', 'pdf', 'failed', 'rejected') $$,
  'a rejected upload can be kept as failed without a file'
);

-- ---------------------------------------------------------------------------
-- Act as Alice
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*)::int from public.source_documents), 1, 'alice sees only her own documents');

select throws_ok(
  $$ insert into public.source_documents (project_id, file_name, raw_text, file_type, extraction_status)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 'Pasted text', 'sneaky', 'pasted_text', 'extracted') $$,
  '42501', null, 'alice cannot add documents to bob''s project'
);

select lives_ok(
  $$ insert into public.source_documents (project_id, file_name, raw_text, file_type, extraction_status)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'Pasted text', 'our brief', 'pasted_text', 'extracted') $$,
  'alice can add pasted text to her own project'
);

select is(
  (select count(*)::int from storage.objects where bucket_id = 'source-documents'),
  0, 'alice cannot list bob''s stored files'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('source-documents', current_setting('test.bob_ws') || '/bbbbbbbb-0000-0000-0000-000000000001/evil.pdf') $$,
  '42501', null, 'alice cannot upload into bob''s workspace folder'
);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('source-documents', current_setting('test.alice_ws') || '/aaaaaaaa-0000-0000-0000-000000000001/ok.pdf') $$,
  'alice can upload into her own workspace folder'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('client-uploads', current_setting('test.alice_ws') || '/aaaaaaaa-0000-0000-0000-000000000001/x.pdf') $$,
  '42501', null, 'agency users cannot write to the client-uploads bucket directly'
);

select * from finish();
rollback;
