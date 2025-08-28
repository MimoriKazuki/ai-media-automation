const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nnzmitqsbubvnbdfuiwj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uem1pdHFzYnVidm5iZGZ1aXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM1NDAxNiwiZXhwIjoyMDcxOTMwMDE2fQ.MfDOs-S3ud-vOg-x-IeDnr6LqLMnCmoRXmYX6_aTJKM';

async function testSystem() {
  console.log('🔍 AA Agent システムテスト開始...\n');
  
  // 1. Supabase接続テスト
  console.log('1️⃣ Supabase接続テスト');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data, error } = await supabase.from('evidence').select('count', { count: 'exact' });
    if (error) throw error;
    console.log('✅ Supabase接続成功');
    console.log(`   現在のエビデンス数: ${data || 0}件\n`);
  } catch (error) {
    console.log('❌ Supabase接続失敗:', error.message);
    console.log('   → Supabase SQLエディタでschema.sqlを実行してください\n');
  }

  // 2. API エンドポイントテスト
  console.log('2️⃣ APIエンドポイントテスト');
  const baseUrl = 'http://localhost:3000';
  
  // Evidence API
  try {
    const res = await fetch(`${baseUrl}/api/evidence`);
    const data = await res.json();
    console.log('✅ GET /api/evidence: 正常動作');
    console.log(`   取得したエビデンス: ${data.evidences?.length || 0}件\n`);
  } catch (error) {
    console.log('❌ Evidence API接続失敗:', error.message, '\n');
  }

  // 3. 環境変数チェック
  console.log('3️⃣ 環境変数チェック');
  const required = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY },
    { key: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY },
    { key: 'ANTHROPIC_API_KEY', value: process.env.ANTHROPIC_API_KEY }
  ];

  required.forEach(({ key, value }) => {
    if (value) {
      console.log(`✅ ${key}: 設定済み`);
    } else {
      console.log(`❌ ${key}: 未設定`);
    }
  });

  console.log('\n📋 次のステップ:');
  console.log('1. Supabase SQLエディタで /supabase/schema.sql を実行');
  console.log('2. http://localhost:3000/inbox でInbox UIにアクセス');
  console.log('3. トピックを入力してエビデンス収集をテスト');
  console.log('4. 収集したエビデンスを承認/却下');
  console.log('5. 承認済みエビデンスから記事生成');
}

// 環境変数を読み込んで実行
require('dotenv').config({ path: '.env.local' });
testSystem().catch(console.error);