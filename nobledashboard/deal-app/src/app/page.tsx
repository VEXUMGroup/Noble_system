import { redirect } from 'next/navigation';
import { LoginCard } from '@/components/auth/LoginCard';
import { clearAppSessionCookie, readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type LoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
  };
};

function sanitizeNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/dashboard';
  }

  return nextPath;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = sanitizeNextPath(searchParams?.next);
  const session = readAppSessionCookie();
  if (session?.userId) {
    try {
      const supabase = createSupabaseAdminClient();
      const { data: member } = await supabase
        .from('m_users')
        .select('id, is_active')
        .eq('id', session.userId)
        .eq('is_active', true)
        .maybeSingle();

      if (member?.id) {
        redirect(nextPath);
      }
    } catch {
      // If the server cannot verify the member record, fall back to rendering login.
    }

    // Session exists but member is invalid/inactive → clear session to avoid redirect loops.
    clearAppSessionCookie();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <LoginCard nextPath={nextPath} initialError={searchParams?.error ?? null} />
    </div>
  );
}
