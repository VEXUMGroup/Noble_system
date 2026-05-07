import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

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

export interface MUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface MSource {
  code: string;
  name: string;
  is_active: boolean;
}

export interface MPlan {
  code: string;
  name: string;
  price: number;
  is_active: boolean;
}

export interface MAgency {
  code: string;
  name: string;
  contact: string | null;
  is_active: boolean;
}

export async function getUsers(onlyActive = true) {
  try {
    let query = supabase.from('master_users').select('*');
    if (onlyActive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    return (data || []) as MUser[];
  } catch (error) {
    console.error('Error in getUsers:', error);
    return [];
  }
}

export async function getSources(onlyActive = true) {
  try {
    let query = supabase.from('master_sources').select('*');
    if (onlyActive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching sources:', error);
      return [];
    }
    return (data || []) as MSource[];
  } catch (error) {
    console.error('Error in getSources:', error);
    return [];
  }
}

export async function getPlans(onlyActive = true) {
  try {
    let query = supabase.from('master_plans').select('*');
    if (onlyActive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
    return (data || []) as MPlan[];
  } catch (error) {
    console.error('Error in getPlans:', error);
    return [];
  }
}

export async function getAgencies(onlyActive = true) {
  try {
    let query = supabase.from('master_agencies').select('*');
    if (onlyActive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching agencies:', error);
      return [];
    }
    return (data || []) as MAgency[];
  } catch (error) {
    console.error('Error in getAgencies:', error);
    return [];
  }
}