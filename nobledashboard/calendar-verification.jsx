import { useState } from "react";

// =====================================================
// Google Calendar 連携 検証ファイル（実データ版）
// 接続アカウント: t.tanaka@vexum-ai.com
// 取得期間: 2026年4月16日〜30日
// =====================================================

const REAL_EVENTS = [
  {
    id: "2el8ajqcbtdd053vh49chgq5es",
    summary: "Noble 仮",
    start: { dateTime: "2026-04-16T10:00:00+09:00" },
    end: { dateTime: "2026-04-16T16:00:00+09:00" },
    attendees: [],
    status: "confirmed",
  },
  {
    id: "0dbl4ek45uh679oc85r5s5bohs",
    summary: "noble週次ミーティング",
    start: { dateTime: "2026-04-16T20:00:00+09:00" },
    end: { dateTime: "2026-04-16T20:30:00+09:00" },
    attendees: ["k.deguchi@vexum-ai.com", "y.takahashi@vexum-ai.com", "t.oyama@vexum-ai.com", "y.katagi@vexum-ai.com"],
    conferenceUrl: "https://meet.google.com/ngn-bzwt-grb",
    status: "confirmed",
  },
  {
    id: "84ufql1q358usn4c9kge8ee4oc_20260417",
    summary: "大学",
    start: { dateTime: "2026-04-17T11:00:00+09:00" },
    end: { dateTime: "2026-04-17T15:00:00+09:00" },
    attendees: [],
    status: "confirmed",
    recurring: true,
  },
  {
    id: "09meg98lntgeh5l0c05lcckigd_20260418",
    summary: "藤花常駐",
    start: { dateTime: "2026-04-18T10:00:00+09:00" },
    end: { dateTime: "2026-04-18T16:00:00+09:00" },
    attendees: [],
    status: "confirmed",
    recurring: true,
  },
  {
    id: "238ir4mb9grgb1l67ndb9i5lnc_20260420",
    summary: "大学",
    start: { dateTime: "2026-04-20T09:00:00+09:00" },
    end: { dateTime: "2026-04-20T18:00:00+09:00" },
    attendees: [],
    status: "confirmed",
    recurring: true,
  },
  {
    id: "utdo6cvksat50b7rouqarc8dvo",
    summary: "チームミーティング",
    start: { dateTime: "2026-04-20T19:00:00+09:00" },
    end: { dateTime: "2026-04-20T20:00:00+09:00" },
    attendees: ["s.yanagisawa@vexum-ai.com", "s.nishimura@vexum-ai.com", "t.oyama@vexum-ai.com", "r.fujita@vexum-ai.com", "y.saeki@vexum-ai.com"],
    conferenceUrl: "https://meet.google.com/gnt-fxzm-kfc",
    status: "confirmed",
  },
  {
    id: "mdrel9j4mtdm247k1efea7rofo_20260421",
    summary: "大学",
    start: { dateTime: "2026-04-21T11:00:00+09:00" },
    end: { dateTime: "2026-04-21T15:00:00+09:00" },
    attendees: [],
    status: "confirmed",
    recurring: true,
  },
  {
    id: "1qp91hk2bed09vale3lmou4ki4",
    summary: "荒井さん",
    start: { dateTime: "2026-04-21T17:00:00+09:00" },
    end: { dateTime: "2026-04-21T17:30:00+09:00" },
    attendees: [],
    status: "confirmed",
  },
  {
    id: "4v2vd7k4rj243677keqrkoq3ab_20260422",
    summary: "大学",
    start: { dateTime: "2026-04-22T09:00:00+09:00" },
    end: { dateTime: "2026-04-22T18:00:00+09:00" },
    attendees: [],
    status: "confirmed",
    recurring: true,
  },
  {
    id: "n7o25u2ugnpiujkm1mdcn5orfm_20260423",
    summary: "Noble常駐山下",
    start: { dateTime: "2026-04-23T10:00:00+09:00" },
    end: { dateTime: "2026-04-23T16:00:00+09:00" },
    attendees: [],
    status: "confirmed",
    recurring: true,
  },
  {
    id: "84ufql1q358usn4c9kge8ee4oc_20260424",
    summary: "大学",
    start: { dateTime: "2026-04-24T11:00:00+09:00" },
    end: { dateTime: "2026-04-24T15:00:00+09:00" },
    attendees: [],
    status: "confirmed",
    recurring: true,
  },
  {
    id: "3joh1q7vqld4h9tbouvr1vnd78_20260425",
    summary: "藤花常駐",
    start: { dateTime: "2026-04-25T10:00:00+09:00" },
    end: { dateTime: "2026-04-25T16:00:00+09:00" },
    attendees: [],
    status: "confirmed",
    recurring: true,
  },
  {
    id: "238ir4mb9grgb1l67ndb9i5lnc_20260427",
    summary: "大学",
    start: { dateTime: "2026-04-27T09:00:00+09:00" },
    end: { dateTime: "2026-04-27T18:00:00+09:00" },
    attendees: [],
    status: "confirmed",
    recurring: true,
  },
  {
    id: "mdrel9j4mtdm247k1efea7rofo_20260428",
    summary: "大学",
    start: { dateTime: "2026-04-28T11:00:00+09:00" },
    end: { dateTime: "2026-04-28T15:00:00+09:00" },
    attendees: [],
    status: "confirmed",
    recurring: true,
  },
  {
    id: "4v2vd7k4rj243677keqrkoq3ab_20260429",
    summary: "大学",
    start: { dateTime: "2026-04-29T09:00:00+09:00" },
    end: { dateTime: "2026-04-29T18:00:00+09:00" },
    attendees: [],
    status: "confirmed",
    recurring: true,
  },
  {
    id: "n7o25u2ugnpiujkm1mdcn5orfm_20260430",
    summary: "Noble常駐山下",
    start: { dateTime: "2026-04-30T10:00:00+09:00" },
    end: { dateTime: "2026-04-30T16:00:00+09:00" },
    attendees: [],
    status: "confirmed",
    recurring: true,
  },
];

// カテゴリ分類（キーワードベース）
function getCategory(summary) {
  if (summary.includes("Noble") || summary.includes("noble")) return "noble";
  if (summary.includes("チームミーティング") || summary.includes("ミーティング")) return "meeting";
  if (summary.includes("常駐")) return "resident";
  if (summary.includes("大学")) return "university";
  return "other";
}

const CATEGORY_STYLES = {
  noble:     { color: "#1d4ed8", bg: "#dbeafe", label: "Noble関連" },
  meeting:   { color: "#7c3aed", bg: "#ede9fe", label: "ミーティング" },
  resident:  { color: "#065f46", bg: "#d1fae5", label: "常駐" },
  university:{ color: "#92400e", bg: "#fef3c7", label: "大学" },
  other:     { color: "#374151", bg: "#f3f4f6", label: "その他" },
};

function formatDate(dateTimeStr) {
  const d = new Date(dateTimeStr);
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
}

function formatTime(dateTimeStr) {
  const d = new Date(dateTimeStr);
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

// 日付ごとにグループ化
function groupByDate(events) {
  const groups = {};
  events.forEach((e) => {
    const day = e.start.dateTime.slice(0, 10);
    if (!groups[day]) groups[day] = [];
    groups[day].push(e);
  });
  return groups;
}

function EventCard({ event }) {
  const cat = getCategory(event.summary);
  const style = CATEGORY_STYLES[cat];
  const hasAttendees = event.attendees && event.attendees.length > 0;

  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderLeft: `4px solid ${style.color}`,
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 8,
      background: "#fff",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111827" }}>{event.summary}</p>
            <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 10, background: style.bg, color: style.color, fontWeight: 500 }}>
              {style.label}
            </span>
            {event.recurring && (
              <span style={{ fontSize: 11, color: "#9ca3af" }}>🔁</span>
            )}
          </div>
          {hasAttendees && (
            <p style={{ margin: "5px 0 0", fontSize: 11, color: "#6b7280" }}>
              👥 {event.attendees.slice(0, 3).map(a => a.split("@")[0]).join(", ")}
              {event.attendees.length > 3 && ` 他${event.attendees.length - 3}名`}
            </p>
          )}
          {event.conferenceUrl && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#3b82f6" }}>🎥 オンライン会議あり</p>
          )}
        </div>
        <div style={{ textAlign: "right", minWidth: 90 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "#374151" }}>
            {formatTime(event.start.dateTime)}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
            〜 {formatTime(event.end.dateTime)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CalendarVerification() {
  const [filter, setFilter] = useState("all");

  const filtered = REAL_EVENTS.filter((e) => {
    if (filter === "all") return true;
    return getCategory(e.summary) === filter;
  });

  const grouped = groupByDate(filtered);
  const totalCount = REAL_EVENTS.length;
  const nobleCount = REAL_EVENTS.filter(e => getCategory(e.summary) === "noble").length;
  const meetingCount = REAL_EVENTS.filter(e => getCategory(e.summary) === "meeting").length;

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 740, margin: "0 auto", padding: 24, background: "#f9fafb", minHeight: "100vh" }}>

      {/* ヘッダー */}
      <div style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)", borderRadius: 12, padding: "20px 24px", color: "#fff", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>📅 Google Calendar 連携検証</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.9 }}>
          t.tanaka@vexum-ai.com　|　2026年4月16日〜30日
        </p>
      </div>

      {/* 接続ステータス */}
      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>✅</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#166534" }}>接続成功・実データ取得済み</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#15803d" }}>
            {totalCount}件の予定を取得 ／ Noble関連 {nobleCount}件 ／ ミーティング {meetingCount}件
          </p>
        </div>
      </div>

      {/* フィルター */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "all", label: "すべて" },
          { key: "noble", label: "Noble関連" },
          { key: "meeting", label: "ミーティング" },
          { key: "resident", label: "常駐" },
          { key: "university", label: "大学" },
        ].map((f) => {
          const active = filter === f.key;
          const catStyle = f.key !== "all" ? CATEGORY_STYLES[f.key] : null;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "1px solid",
                fontSize: 12,
                cursor: "pointer",
                background: active ? (catStyle ? catStyle.color : "#1d4ed8") : "#fff",
                color: active ? "#fff" : "#374151",
                borderColor: active ? (catStyle ? catStyle.color : "#1d4ed8") : "#d1d5db",
                fontWeight: active ? 600 : 400,
              }}
            >
              {f.label}
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>
          {filtered.length} 件表示
        </span>
      </div>

      {/* 日付ごとのイベント */}
      {Object.entries(grouped).map(([day, events]) => (
        <div key={day} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              {formatDate(events[0].start.dateTime)}
            </span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            <span style={{ fontSize: 11, color: "#9ca3af" }}>{events.length}件</span>
          </div>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ))}

    </div>
  );
}
