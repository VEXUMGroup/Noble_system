import { google } from 'googleapis';

export type CalendarEvent = {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
  htmlLink?: string | null;
};

/**
 * サービスアカウント + ドメイン委任でユーザーのGoogle Calendarを取得する（サーバー専用）。
 *
 * 必要な環境変数:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  - サービスアカウントのメールアドレス
 *   GOOGLE_PRIVATE_KEY            - サービスアカウントの秘密鍵（\n エスケープ込み）
 *
 * Google Workspace 管理コンソールでドメイン委任が必要:
 *   スコープ: https://www.googleapis.com/auth/calendar.readonly
 */
export async function getCalendarEventsForUser(
  userEmail: string,
  daysAhead = 7
): Promise<CalendarEvent[]> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_EMAIL と GOOGLE_PRIVATE_KEY を .env.local に設定してください'
    );
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    subject: userEmail, // このユーザーをなりすまして取得
  });

  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + daysAhead);

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: until.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 20,
    timeZone: 'Asia/Tokyo',
  });

  return (res.data.items ?? []) as CalendarEvent[];
}
