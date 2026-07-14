-- ==========================================================
-- LINE会員証機能 用 Supabase(PostgreSQL) テーブル定義
-- ==========================================================

-- 会員テーブル（今後の拡張フィールドを見越して余裕を持たせています）
create table if not exists members (
  id            uuid primary key default gen_random_uuid(),
  line_user_id  text unique not null,        -- LINEログインで取得するuser id
  member_no     text unique not null,        -- 会員番号（発番ロジックはserver側）
  name          text not null,               -- 会員名（初期値はLINEプロフィール名）
  points        integer not null default 0,  -- 保有ポイント
  rank          text default 'normal',       -- 将来のランク制度用
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ポイント履歴テーブル（フェーズ2以降の拡張用。付与/利用の内訳を残せます）
create table if not exists point_histories (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references members(id) on delete cascade,
  change       integer not null,     -- +付与 / -利用
  reason       text,                 -- 例: "来店ポイント", "クーポン利用"
  created_at   timestamptz not null default now()
);

-- 会員番号を自動採番する関数（8桁ゼロ埋め連番の例）
create sequence if not exists member_no_seq start 10000001;

create or replace function generate_member_no()
returns text as $$
begin
  return lpad(nextval('member_no_seq')::text, 8, '0');
end;
$$ language plpgsql;

-- 検索を早くするためのインデックス
create index if not exists idx_members_line_user_id on members(line_user_id);
