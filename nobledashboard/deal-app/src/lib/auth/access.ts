import type { SupabaseClient, User } from '@supabase/supabase-js';

export type AppRole = 'sales' | 'manager';

export interface AppUserRecord {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  is_active?: boolean;
}

export interface AuthenticatedAppUser {
  authUserId: string;
  appUserId: string;
  name: string;
  email: string;
  role: AppRole;
}

export type SessionState =
  | { status: 'anonymous' }
  | { status: 'unauthorized'; authUser: User | null }
  | { status: 'authenticated'; user: AuthenticatedAppUser };

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_callback: 'Googleログインの処理に失敗しました。もう一度お試しください。',
  config_missing:
    'Supabaseの認証設定が不足しています。.env.local と Supabase Auth の設定を確認してください。',
  login_required: 'ログインが必要です。',
  oauth_cancelled: 'Googleログインがキャンセルされました。',
  user_not_authorized:
    'このGoogleアカウントは利用を許可されていません。`m_users` にメールアドレスを登録してください。',
};

export function getAuthErrorMessage(errorCode?: string | null): string | null {
  if (!errorCode) {
    return null;
  }

  return AUTH_ERROR_MESSAGES[errorCode] ?? '認証に失敗しました。';
}

export function getSafeNextPath(nextPath?: string | null): string {
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/deals';
  }

  return nextPath;
}

export function getRoleLabel(role: AppRole): string {
  const roleMap: Record<AppRole, string> = {
    sales: '営業',
    manager: 'マネージャー',
  };

  return roleMap[role];
}

export async function getSessionState(
  supabase: SupabaseClient
): Promise<SessionState> {
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser?.email) {
    return { status: 'anonymous' };
  }

  const appUser = await getActiveAppUserByEmail(supabase, authUser.email);

  if (!appUser) {
    return { status: 'unauthorized', authUser };
  }

  return {
    status: 'authenticated',
    user: {
      authUserId: authUser.id,
      appUserId: appUser.id,
      name: appUser.name,
      email: appUser.email,
      role: appUser.role,
    },
  };
}

async function getActiveAppUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<AppUserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('m_users')
    .select('id, name, email, role, is_active')
    .ilike('email', normalizedEmail)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as AppUserRecord;
}
