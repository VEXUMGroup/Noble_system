import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nyvkialietmmwnifapes.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rNtm8r3QiNcrpt8v2iMdeA_n2epcY1r';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSources() {
  const { data, error } = await supabase
    .from('m_sources')
    .select('code, name, is_active');
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Available sources:');
  if (data.length === 0) {
    console.log('  (no sources found)');
  } else {
    data.forEach(s => {
      console.log(`  - ${s.code}: ${s.name} (active: ${s.is_active})`);
    });
  }
}

checkSources().catch(console.error);
