import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { redirect } from 'next/navigation';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await readAppSessionCookie();
    if (!session) {
      redirect('/');
    }

    const supabase = createSupabaseAdminClient();
    const { data: member, error } = await supabase
      .from('m_users')
      .select('id, name, email, role, is_active')
      .eq('id', session.userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[authenticated/layout] member lookup failed', {
        message: error.message,
        code: error.code,
      });
      redirect('/?error=internal_error');
    }

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
  } catch (error) {
    console.error('[authenticated/layout] unexpected error', error);
    redirect('/?error=internal_error');
  }
}
