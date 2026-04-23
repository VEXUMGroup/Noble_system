import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DealFilters {
  status?: string;
  assigned_to?: string;
}

export async function getDeals(filters?: DealFilters) {
  try {
    let query = supabase.from('deals').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching deals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDeals:', error);
    return [];
  }
}

export async function getDeal(id: string) {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching deal:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getDeal:', error);
    return null;
  }
}
