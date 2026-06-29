import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { redirect } from 'next/navigation';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readAppSessionCookie();
  if (!session) {
    redirect('/');
  }

  const supabase = createSupabaseAdminClient();
  const { data: member } = await supabase
    .from('m_users')
    .select('id, name, email, role, is_active')
    .eq('id', session.userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!member?.id) {
    redirect('/?error=unauthorized_user');
  }

  const currentUser = {
    id: member.id,
    name: member.name ?? session.email,
    email: member.email ?? session.email,
    role: (member.role ?? 'sales') as 'sales' | 'manager',
  };

  return <AuthenticatedShell currentUser={currentUser}>{children}</AuthenticatedShell>;
}
