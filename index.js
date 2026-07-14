// ==========================================================
// LINE会員証機能 バックエンドAPI (Node.js / Express)
// Supabaseをデータストアとして利用
// ==========================================================
//
// 事前準備:
//   npm install express @supabase/supabase-js cors dotenv
//
// .env に以下を設定してください:
//   SUPABASE_URL=xxxx
//   SUPABASE_SERVICE_ROLE_KEY=xxxx   ※service_role key(サーバー専用・絶対に公開しない)
//   PORT=3000
//
// 起動:
//   node server/index.js
// ==========================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --------------------------------------------------------
// GET /member/:lineUserId
// 会員情報を取得（存在しない場合は404）
// --------------------------------------------------------
app.get('/member/:lineUserId', async (req, res) => {
  const { lineUserId } = req.params;

  const { data, error } = await supabase
    .from('members')
    .select('member_no, name, points, rank, created_at')
    .eq('line_user_id', lineUserId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'member_not_found' });
  }

  res.json(data);
});

// --------------------------------------------------------
// POST /member/register
// 初回アクセス時に会員登録（すでにあれば既存データを返すだけ）
// body: { lineUserId, name }
// --------------------------------------------------------
app.post('/member/register', async (req, res) => {
  const { lineUserId, name } = req.body;

  if (!lineUserId) {
    return res.status(400).json({ error: 'lineUserId_required' });
  }

  // 既に会員が存在するか確認
  const { data: existing } = await supabase
    .from('members')
    .select('member_no, name, points, rank, created_at')
    .eq('line_user_id', lineUserId)
    .single();

  if (existing) {
    return res.json(existing);
  }

  // 会員番号を発番
  const { data: noData, error: noError } = await supabase.rpc('generate_member_no');
  if (noError) {
    return res.status(500).json({ error: 'member_no_generation_failed' });
  }

  const { data: created, error: insertError } = await supabase
    .from('members')
    .insert({
      line_user_id: lineUserId,
      member_no: noData,
      name: name || '会員',
    })
    .select('member_no, name, points, rank, created_at')
    .single();

  if (insertError) {
    return res.status(500).json({ error: 'insert_failed', detail: insertError.message });
  }

  res.status(201).json(created);
});

// --------------------------------------------------------
// POST /points/add
// ポイント加算・減算（フェーズ2で使う想定のサンプルエンドポイント）
// body: { lineUserId, change, reason }
// --------------------------------------------------------
app.post('/points/add', async (req, res) => {
  const { lineUserId, change, reason } = req.body;

  if (!lineUserId || typeof change !== 'number') {
    return res.status(400).json({ error: 'invalid_params' });
  }

  const { data: member, error: findError } = await supabase
    .from('members')
    .select('id, points')
    .eq('line_user_id', lineUserId)
    .single();

  if (findError || !member) {
    return res.status(404).json({ error: 'member_not_found' });
  }

  const newPoints = member.points + change;

  const { error: updateError } = await supabase
    .from('members')
    .update({ points: newPoints, updated_at: new Date().toISOString() })
    .eq('id', member.id);

  if (updateError) {
    return res.status(500).json({ error: 'update_failed' });
  }

  await supabase.from('point_histories').insert({
    member_id: member.id,
    change,
    reason: reason || null,
  });

  res.json({ points: newPoints });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Member card API listening on port ${PORT}`);
});
