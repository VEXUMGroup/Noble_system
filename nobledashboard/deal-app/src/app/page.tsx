import { redirect } from 'next/navigation';
import { LoginCard } from '@/components/auth/LoginCard';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
  const supabase = createSupabaseServerClient();
  const nextPath = sanitizeNextPath(searchParams?.next);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user?.id) {
    const { data: member } = await supabase
      .from('m_users')
      .select('id, is_active')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (member) {
      redirect(nextPath);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <LoginCard nextPath={nextPath} initialError={searchParams?.error ?? null} />
    </div>
  );
}
