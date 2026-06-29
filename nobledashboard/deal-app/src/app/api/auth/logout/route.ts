import { NextResponse } from 'next/server';
import { clearAppSessionCookie } from '@/lib/auth/app-session';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAppSessionCookie(response);
  return response;
}
