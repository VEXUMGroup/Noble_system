import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'app_session';

type SessionPayload = {
  email: string;
  userId: string;
  exp: number;
};

function getAuthSecret() {
  return process.env.APP_AUTH_SECRET ?? null;
}

function base64UrlEncode(input: Buffer | string) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buffer
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function base64UrlDecode(input: string) {
  const normalized = input.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  return Buffer.from(padded, 'base64');
}

function sign(data: string) {
  const secret = getAuthSecret();
  if (!secret) throw new Error('APP_AUTH_SECRET is missing');
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export function createSessionToken(payload: SessionPayload) {
  const json = JSON.stringify(payload);
  const encoded = base64UrlEncode(json);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  if (sign(encoded) !== signature) return null;

  const decoded = base64UrlDecode(encoded).toString('utf8');
  const payload = JSON.parse(decoded) as SessionPayload;
  if (!payload?.email || !payload?.userId || typeof payload.exp !== 'number') return null;
  if (Date.now() > payload.exp) return null;
  return payload;
}

export async function setAppSessionCookie(token: string) {
  'use server';
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function clearAppSessionCookie() {
  'use server';
  const store = await cookies();
  store.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function readAppSessionCookie() {
  try {
    const store = cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}
