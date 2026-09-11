create extension if not exists pgcrypto;
create table if not exists photos (
  id           uuid primary key default gen_random_uuid(),
  friend_name  text not null,
  path         text not null unique,       
  views        integer not null default 0,
  downloads    integer not null default 0,
  hype         integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_photos_friend_name on photos (friend_name);
create index if not exists idx_photos_views       on photos (views desc);
create index if not exists idx_photos_downloads   on photos (downloads desc);
create index if not exists idx_photos_hype        on photos (hype desc);

create table if not exists hype_log (
  id          uuid primary key default gen_random_uuid(),
  photo_id    uuid not null references photos(id) on delete cascade,
  device_id   text not null,
  created_at  timestamptz not null default now(),
  unique (photo_id, device_id)
);

create or replace function get_distinct_friends()
returns table (friend_name text) as $$
  select distinct p.friend_name
  from photos p
  order by p.friend_name;
$$ language sql stable;

grant execute on function get_distinct_friends() to anon, authenticated, service_role;


alter table photos   enable row level security;
alter table hype_log enable row level security;

create policy "photos are readable"
  on photos for select
  using (true);

create or replace function increment_view(p_photo_id uuid)
returns void as $$
  update photos set views = views + 1 where id = p_photo_id;
$$ language sql security definer;

create or replace function increment_download(p_photo_id uuid)
returns void as $$
  update photos set downloads = downloads + 1 where id = p_photo_id;
$$ language sql security definer;


create or replace function add_hype(p_photo_id uuid, p_device_id text)
returns integer as $$
declare
  new_count integer;
begin
  begin
    insert into hype_log (photo_id, device_id) values (p_photo_id, p_device_id);
    update photos set hype = hype + 1 where id = p_photo_id
      returning hype into new_count;
  exception when unique_violation then
    select hype into new_count from photos where id = p_photo_id;
  end;
  return new_count;
end;
$$ language plpgsql security definer;

revoke execute on function increment_view(uuid)        from public, anon, authenticated;
revoke execute on function increment_download(uuid)     from public, anon, authenticated;
revoke execute on function add_hype(uuid, text)          from public, anon, authenticated;

grant execute on function increment_view(uuid)        to service_role;
grant execute on function increment_download(uuid)     to service_role;
grant execute on function add_hype(uuid, text)          to service_role;