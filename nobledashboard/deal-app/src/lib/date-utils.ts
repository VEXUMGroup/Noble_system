const JST_TIME_ZONE = 'Asia/Tokyo';

function toYmdParts(reference: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: JST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(reference);

  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return { year, month, day };
}

export function getJstTodayYmd(reference = new Date()): string {
  const { year, month, day } = toYmdParts(reference);
  return `${year}-${month}-${day}`;
}

export function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseYmdToUtcDate(value: string): Date | null {
  if (!isYmd(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateToYmd(reference: Date): string {
  const { year, month, day } = toYmdParts(reference);
  return `${year}-${month}-${day}`;
}

export function addDaysToYmd(ymd: string, days: number): string {
  const date = parseYmdToUtcDate(ymd);
  if (!date) return ymd;
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateToYmd(date);
}

export function getDaysBetweenYmd(fromYmd: string, toYmd: string): number | null {
  const from = parseYmdToUtcDate(fromYmd);
  const to = parseYmdToUtcDate(toYmd);
  if (!from || !to) return null;
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

export function getDaysUntilYmd(targetYmd: string, reference = new Date()): number | null {
  const todayYmd = getJstTodayYmd(reference);
  return getDaysBetweenYmd(todayYmd, targetYmd);
}

