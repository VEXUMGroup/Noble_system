import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nyvkialietmmwnifapes.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rNtm8r3QiNcrpt8v2iMdeA_n2epcY1r';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDealInsert() {
  console.log('🧪 Testing deal insertion with valid source code...\n');
  
  const testDealId = `D-${Date.now()}-TEST`;
  const today = new Date().toISOString().split('T')[0];
  
  const newDeal = {
    id: testDealId,
    customer_name: 'テストユーザー',
    assigned_to: 'USR001',
    deal_date: today,
    source: 'SRC001', // Valid source code
    status: null, // null is now allowed after migration 003
    retirement_date: '2026年6月末',
    result_status: undefined,
    prospect_level: undefined,
    referrer: undefined,
    agency_type: undefined,
    memo: undefined,
    next_action_date: undefined,
    recording_url: undefined,
    remarks: undefined,
    created_by: 'USR001',
    updated_by: 'USR001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  console.log('Attempting to insert deal:', {
    id: newDeal.id,
    customer_name: newDeal.customer_name,
    source: newDeal.source,
    status: newDeal.status,
  });
  
  const { data, error } = await supabase
    .from('deals')
    .insert(newDeal);
  
  if (error) {
    console.error('❌ Insert failed:', error.message);
    console.error('   Code:', error.code);
    return false;
  }
  
  console.log('✅ Insert succeeded!');
  
  // Clean up
  const { error: deleteError } = await supabase
    .from('deals')
    .delete()
    .eq('id', testDealId);
  
  if (deleteError) {
    console.error('⚠️  Could not clean up test record:', deleteError.message);
  } else {
    console.log('✅ Test record cleaned up');
  }
  
  return true;
}

testDealInsert()
  .then(success => {
    console.log('\n' + (success ? '✅ All tests passed!' : '❌ Tests failed'));
  })
  .catch(console.error);
