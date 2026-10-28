-- Repair an overly escaped email validation regex in existing databases.
-- Safe: does not delete table, requests, policies or accounts.
alter table public.ib_access_requests
  drop constraint if exists valid_request_email;
alter table public.ib_access_requests
  add constraint valid_request_email
  check (
    length(email) between 5 and 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  );
notify pgrst, 'reload schema';
