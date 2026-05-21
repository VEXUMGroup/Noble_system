import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nyvkialietmmwnifapes.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rNtm8r3QiNcrpt8v2iMdeA_n2epcY1r';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkStatuses() {
  const { data, error } = await supabase
    .from('m_statuses')
    .select('code, name, sort_order, is_active')
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('ステータス一覧（進行順）:\n');
  data.forEach((s, idx) => {
    console.log(`${idx + 1}. [${s.code}] ${s.name} (sort_order: ${s.sort_order})`);
  });
  
  console.log('\n\nどのステータスが「事務承認」ですか？');
}

checkStatuses().catch(console.error);
