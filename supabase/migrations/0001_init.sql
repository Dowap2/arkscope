-- raids 테이블
create table if not exists raids (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  raid_name text,
  share_token text not null unique default gen_random_uuid()::text,
  created_at timestamptz not null default now()
);

-- raid_members 테이블
create table if not exists raid_members (
  id uuid primary key default gen_random_uuid(),
  raid_id uuid not null references raids(id) on delete cascade,
  account_name text not null,
  created_at timestamptz not null default now()
);

-- characters 테이블
create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  raid_member_id uuid not null references raid_members(id) on delete cascade,
  character_name text not null,
  server_name text not null,
  class text not null,
  item_level numeric not null,
  created_at timestamptz not null default now()
);

-- 인덱스
create index if not exists idx_raid_members_raid_id on raid_members(raid_id);
create index if not exists idx_characters_raid_member_id on characters(raid_member_id);
create index if not exists idx_raids_share_token on raids(share_token);
