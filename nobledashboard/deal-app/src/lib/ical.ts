import { async as icalAsync, type VEvent, type ParameterValue } from 'node-ical';

export type ICalEvent = {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  url?: string;
};

/** ParameterValue<string> を string に変換するヘルパー */
function paramToString(val: ParameterValue | undefined): string | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'string') return val;
  return val.val;
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
  const data = await icalAsync.fromURL(icalUrl);

  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + daysAhead);

  const events: ICalEvent[] = [];

  for (const key in data) {
    const component = data[key];
    // VEvent だけを対象にする
    if (!component || component.type !== 'VEVENT') continue;
    const ev = component as VEvent;

    const start: Date = ev.start;
    const end: Date = ev.end ?? ev.start;

    if (!start) continue;

    // 期間内のイベントのみ（終了が過去 or 開始が未来すぎる は除外）
    if (start > until || end < now) continue;

    events.push({
      id: ev.uid ?? key,
      summary: paramToString(ev.summary) ?? '（タイトルなし）',
      start,
      end,
      location: paramToString(ev.location),
      description: paramToString(ev.description),
      url: ev.url,
    });
  }

  // 開始日時順に並べる
  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  return events;
}
