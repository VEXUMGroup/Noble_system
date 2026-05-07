import { redirect } from 'next/navigation';
import { getSessionState } from '@/lib/auth/access';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { hasSupabaseCredentials } from '@/lib/supabase-auth/config';
import { createServerSupabaseClient } from '@/lib/supabase-auth/server';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseCredentials()) {
    redirect('/?error=config_missing');
  }

  const supabase = createServerSupabaseClient();
  const sessionState = await getSessionState(supabase);

  if (sessionState.status === 'anonymous') {
    redirect('/?error=login_required');
  }

  if (sessionState.status === 'unauthorized') {
    redirect('/auth/signout?reason=user_not_authorized');
  }

  return (
    <AuthenticatedShell user={sessionState.user}>
      {children}
    </AuthenticatedShell>
  );
}
