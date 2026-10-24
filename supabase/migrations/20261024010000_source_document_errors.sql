-- Milestone 2: store a user-facing reason when text extraction fails.

alter table public.source_documents
  add column extraction_error text check (char_length(extraction_error) <= 500);

-- Pasted text never has a stored file. Uploaded files always do, unless the file
-- was rejected (e.g. failed the content check) and removed from Storage.
alter table public.source_documents
  add constraint source_documents_file_path_consistent check (
    (file_type = 'pasted_text' and file_path is null)
    or (file_type <> 'pasted_text' and (file_path is not null or extraction_status = 'failed'))
  );
