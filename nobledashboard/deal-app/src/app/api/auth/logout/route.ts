import { NextResponse } from 'next/server';
import { clearAppSessionCookie } from '@/lib/auth/app-session';

export async function POST() {
  await clearAppSessionCookie();
  return NextResponse.json({ ok: true });
}

