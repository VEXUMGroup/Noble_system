export type ICalEvent = {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  url?: string;
};

function unfoldIcs(raw: string): string[] {
  return raw.replace(/\r\n[ \t]/g, '').split(/\r?\n/);
}

function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function parseIcsDate(value: string): Date | null {
  if (!value) return null;
  if (/^\d{8}$/.test(value)) {
    const y = Number(value.slice(0, 4));
    const m = Number(value.slice(4, 6));
    const d = Number(value.slice(6, 8));
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  }
  if (/^\d{8}T\d{6}Z$/.test(value)) {
    const y = Number(value.slice(0, 4));
    const m = Number(value.slice(4, 6));
    const d = Number(value.slice(6, 8));
    const hh = Number(value.slice(9, 11));
    const mm = Number(value.slice(11, 13));
    const ss = Number(value.slice(13, 15));
    return new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
  }
  return null;
}

/**
 * iCal URL を fetch してイベント一覧を返す（サーバー専用）。
 * @param icalUrl Google カレンダーの「非公開 iCal URL」
 * @param daysAhead 今日から何日先までを取得するか（デフォルト 7日）
 */
export async function fetchICalEvents(
  icalUrl: string,
  daysAhead = 7
): Promise<ICalEvent[]> {
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + daysAhead);

  const res = await fetch(icalUrl, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`ical_http_${res.status}`);
  }
  const text = await res.text();
  const lines = unfoldIcs(text);

  const events: ICalEvent[] = [];
  let current: Partial<ICalEvent> & { end?: Date } | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current?.start) {
        const start = current.start;
        const end = current.end ?? current.start;
        if (start <= until && end >= now) {
          events.push({
            id: current.id ?? `${start.getTime()}`,
            summary: current.summary ?? '（タイトルなし）',
            start,
            end,
            location: current.location,
            description: current.description,
            url: current.url,
          });
        }
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const rawKey = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const key = rawKey.split(';', 1)[0].toUpperCase();

    if (key === 'UID') current.id = value.trim();
    if (key === 'SUMMARY') current.summary = unescapeIcsText(value.trim());
    if (key === 'DESCRIPTION') current.description = unescapeIcsText(value.trim());
    if (key === 'LOCATION') current.location = unescapeIcsText(value.trim());
    if (key === 'URL') current.url = value.trim();
    if (key === 'DTSTART') current.start = parseIcsDate(value.trim()) ?? undefined;
    if (key === 'DTEND') current.end = parseIcsDate(value.trim()) ?? undefined;
  }

  // 開始日時順に並べる
  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  return events;
}


export type CalendarDealDraft = {
  customer_name: string;
  deal_date: string;
  deal_notes: string | null;
  source: string;
  calendar_event_id: string;
};

export type LStepCalendarProfile = {
  customerName?: string;
  retirementDate?: string;
  noteLines: string[];
};

function normalizeDateTextToIso(raw: string): string | undefined {
  const text = raw.replace(/[年月./]/g, '-').replace(/日/g, '').replace(/\s+/g, '').trim();
  const m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return undefined;
  const y = m[1];
  const mm = m[2].padStart(2, '0');
  const dd = m[3].padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

export function parseLStepCalendarDescription(description?: string): LStepCalendarProfile {
  if (!description?.trim()) return { noteLines: [] };
  const lines = description.split('\n').map((v) => v.trim()).filter(Boolean);
  const profile: LStepCalendarProfile = { noteLines: [] };

  for (const line of lines) {
    const matched = line.match(/^([^:：]+)\s*[:：]\s*(.+)$/);
    if (!matched) continue;
    const key = matched[1].trim();
    const value = matched[2].trim();
    if (!value) continue;

    if (key.includes('氏名') && !profile.customerName) profile.customerName = value;
    if (key.includes('退職予定日') && !profile.retirementDate) {
      profile.retirementDate = normalizeDateTextToIso(value);
    }
    profile.noteLines.push(`${key}: ${value}`);
  }

  return profile;
}

export function formatEventForDeal(event: ICalEvent): CalendarDealDraft {
  const parsed = parseLStepCalendarDescription(event.description);
  return {
    customer_name: parsed.customerName || event.summary?.trim() || '（タイトルなし）',
    deal_date: event.start.toISOString().slice(0, 10),
    deal_notes: parsed.noteLines.length > 0 ? parsed.noteLines.join('\n') : event.description?.trim() || null,
    source: 'LINE',
    calendar_event_id: event.id,
  };
}
