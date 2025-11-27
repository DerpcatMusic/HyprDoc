-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- DOCUMENTS TABLE
create table documents (
  id uuid primary key default uuid_generate_v4(),
  title text not null default 'Untitled Document',
  content jsonb not null default '{}'::jsonb,
  owner_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table documents enable row level security;

-- Policies
create policy "Users can create their own documents"
  on documents for insert
  with check (auth.uid() = owner_id);

create policy "Users can view their own documents"
  on documents for select
  using (auth.uid() = owner_id);

create policy "Users can update their own documents"
  on documents for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own documents"
  on documents for delete
  using (auth.uid() = owner_id);

-- AUDIT LOGS TABLE
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  action text not null, -- e.g., 'viewed', 'edited', 'signed'
  details jsonb default '{}'::jsonb,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table audit_logs enable row level security;

-- Policies
create policy "Users can view audit logs for their documents"
  on audit_logs for select
  using (
    exists (
      select 1 from documents
      where documents.id = audit_logs.document_id
      and documents.owner_id = auth.uid()
    )
  );

create policy "System can insert audit logs"
  on audit_logs for insert
  with check (true); -- In a real app, this might be restricted to service role or specific functions
