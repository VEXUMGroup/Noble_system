#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nyvkialietmmwnifapes.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rNtm8r3QiNcrpt8v2iMdeA_n2epcY1r';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDealInsert() {
  console.log('🔍 Testing deals table schema...\n');

  console.log('1️⃣ Testing insert with created_by=null...');
  const testDealId = `TEST-${Date.now()}`;
  const { error: insertError } = await supabase.from('deals').insert({
    id: testDealId,
    customer_name: 'Test Customer',
    assigned_to: 'USR001',
    deal_date: new Date().toISOString().split('T')[0],
    source: 'WEB',
    status: 'NEW',
    retirement_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    created_by: null,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error('❌ FAILED:', insertError.message);
    console.log('\n⚠️ created_by / updated_by は NOT NULL 制約がある！');
    console.log('   マイグレーション 003 が実行されていない可能性があります。');
    console.log('\n💡 解決策:');
    console.log('   → フロントエンド: created_by/updated_by に有効な user_id を設定する');
    process.exit(1);
  } else {
    console.log('✅ SUCCESS: Null value accepted');
    
    const { error: deleteError } = await supabase.from('deals').delete().eq('id', testDealId);
    if (deleteError) console.error('Cleanup error:', deleteError.message);
    process.exit(0);
  }
}

testDealInsert().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
