#!/usr/bin/env node
/**
 * Supabase deals テーブルスキーマを確認して、
 * created_by / updated_by カラムの NOT NULL 制約をテストする
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nyvkialietmmwnifapes.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rNtm8r3QiNcrpt8v2iMdeA_n2epcY1r';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDealInsert() {
  console.log('🔍 Testing deals table schema...\n');

  // 1. テーブル情報を取得（RLS が有効でない場合）
  console.log('1️⃣ Checking existing deals...');
  const { data: existingDeals, error: selectError } = await supabase
    .from('deals')
    .select('id, created_by, updated_by')
    .limit(1);

  if (selectError) {
    console.error('❌ Select error:', selectError.message);
  } else {
    console.log('✅ Select succeeded');
    if (existingDeals && existingDeals.length > 0) {
      const deal = existingDeals[0];
      console.log(`   Sample deal: id=${deal.id}, created_by=${deal.created_by}, updated_by=${deal.updated_by}`);
    }
  }

  // 2. created_by が null の deal を挿入してみる（テスト用）
  console.log('\n2️⃣ Testing insert with created_by=null...');
  const testDealId = `TEST-${Date.now()}`;
  const { data: insertData, error: insertError } = await supabase
    .from('deals')
    .insert({
      id: testDealId,
      customer_name: 'Test Customer',
      assigned_to: 'USR001',
      deal_date: new Date().toISOString().split('T')[0],
      source: 'WEB',
      status: 'NEW',
      retirement_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      created_by: null,  // ← ここが null
      updated_by: null,  // ← ここが null
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (insertError) {
    console.error('❌ Insert error:', insertError.message);
    console.error('   Error code:', insertError.code);
    if (insertError.details) {
      console.error('   Error details:', insertError.details);
    }
    console.log('\n⚠️  created_by / updated_by は NOT NULL 制約がある！');
    console.log('   マイグレーション 003 が実行されていない可能性があります。');
  } else {
    console.log('✅ Insert succeeded with null values');
    console.log('   Insert data:', insertData);
  }

  // 3. created_by に有効な user_id を設定して再度試す
  console.log('\n3️⃣ Testing insert with created_by=USR001...');
  const testDealId2 = `TEST-${Date.now()}-2`;
  const { data: insertData2, error: insertError2 } = await supabase
    .from('deals')
    .insert({
      id: testDealId2,
      customer_name: 'Test Customer 2',
      assigned_to: 'USR001',
      deal_date: new Date().toISOString().split('T')[0],
      source: 'WEB',
      status: 'NEW',
      retirement_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      created_by: 'USR001',  // ← ここに有効な user_id
      updated_by: 'USR001',  // ← ここに有効な user_id
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (insertError2) {
    console.error('❌ Insert error:', insertError2.message);
  } else {
    console.log('✅ Insert succeeded with user_id values');
    console.log('   Inserted test deal:', testDealId2);

    // クリーンアップ：テスト用レコードを削除
    console.log('\n4️⃣ Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('deals')
      .delete()
      .eq('id', testDealId2);

    if (deleteError) {
      console.error('❌ Delete error:', deleteError.message);
    } else {
      console.log('✅ Test record deleted');
    }
  }

  console.log('\n📝 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (insertError) {
    console.log('❌ created_by/updated_by に null を入れられない');
    console.log('💡 解決策：');
    console.log('   1. フロントエンドで常に有効な user_id を set する');
    console.log('   2. デフォルト値を DB に設定する');
    console.log('   3. マイグレーション 003 を再度実行する');
  } else {
    console.log('✅ created_by/updated_by に null を入れられる');
    console.log('   マイグレーション 003 が正しく実行されている');
  }
}

testDealInsert().catch(console.error);
