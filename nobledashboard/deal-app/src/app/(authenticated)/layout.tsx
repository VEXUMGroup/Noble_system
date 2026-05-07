import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: member } = user
      ? await supabase
        .from('m_users')
        .select('id, name, email, role')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()
    : { data: null };

  const currentUser = {
    id: member?.id ?? user?.id ?? 'unknown',
    name: member?.name ?? user?.email ?? 'Unknown User',
    email: member?.email ?? user?.email ?? '',
    role: (member?.role ?? 'sales') as 'sales' | 'admin_staff' | 'manager',
  };

  return <AuthenticatedShell currentUser={currentUser}>{children}</AuthenticatedShell>;
}
