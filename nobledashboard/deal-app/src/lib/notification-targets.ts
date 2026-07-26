import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type NotificationAudience = 'sales' | 'admin_staff';

export async function resolveNotificationRecipientUserIds(params: {
  audience: NotificationAudience;
  assignedTo?: string | null;
}): Promise<string[]> {
  if (params.audience === 'sales') {
    return params.assignedTo ? [params.assignedTo] : [];
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('m_users')
    .select('id')
    .eq('role', 'manager')
    .eq('is_active', true);

  if (error) {
    throw new Error(error.message);
  }

  return Array.from(new Set((data ?? []).map((user) => user.id).filter(Boolean)));
}
