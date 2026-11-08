create table accounts(id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users, name text not null, type text default 'bank', opening numeric default 0);
create table transactions(id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users,
 account_id uuid references accounts on delete cascade, to_account_id uuid references accounts on delete cascade,
 type text not null check (type in ('income','expense','transfer')), category text, amount numeric not null check (amount>0),
 merchant text, note text, date date not null default current_date, created_at timestamptz default now());
create table budgets(id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users, category text not null, amount numeric not null, unique(user_id,category));
create table goals(id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users, name text not null, target numeric not null, current numeric default 0, target_date date);
create table bills(id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users, name text not null, amount numeric not null, due_date date not null, paid boolean default false);
do $$ declare t text; begin foreach t in array array['accounts','transactions','budgets','goals','bills'] loop
 execute format('alter table %I enable row level security',t);
 execute format('create policy "own rows" on %I for all using (user_id=auth.uid()) with check (user_id=auth.uid())',t);
end loop; end $$;
