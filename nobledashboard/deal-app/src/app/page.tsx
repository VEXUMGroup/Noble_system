import { redirect } from 'next/navigation';
import { getAuthErrorMessage, getSessionState } from '@/lib/auth/access';
import { LoginCard } from '@/components/auth/LoginCard';
import { hasSupabaseCredentials } from '@/lib/supabase-auth/config';
import { createServerSupabaseClient } from '@/lib/supabase-auth/server';

interface LoginPageProps {
  searchParams?: {
    error?: string | string[];
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const configMissing = !hasSupabaseCredentials();
  const errorCode = readSearchParam(searchParams?.error);

  if (!configMissing) {
    const supabase = createServerSupabaseClient();
    const sessionState = await getSessionState(supabase);

    if (sessionState.status === 'authenticated') {
      redirect('/dashboard');
    }

    if (sessionState.status === 'unauthorized') {
      redirect('/auth/signout?reason=user_not_authorized');
    }
  }

  return (
    <LoginCard
      configMissing={configMissing}
      errorMessage={getAuthErrorMessage(errorCode)}
    />
  );
}

function readSearchParam(param?: string | string[]) {
  if (Array.isArray(param)) {
    return param[0];
  }

  return param ?? null;
}
