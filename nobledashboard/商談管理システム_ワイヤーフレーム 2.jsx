import { useState } from "react";

// ── Tokens ──
const C = { primary: "#1F3864", accent: "#2B5797", light: "#D6E4F0", bg: "#F5F7FA", white: "#FFFFFF", border: "#D1D5DB", text: "#1F2937", sub: "#6B7280", success: "#059669", warn: "#D97706", danger: "#DC2626", purple: "#7C3AED", blue: "#2563EB", teal: "#0D9488" };

// ── Status ──
const S = {
  RESERVE: "予約", READY: "商談準備", CONSULTED: "商談済", CLOSED: "成約",
  REVIEW: "検討", NOT_TARGET: "対象外",
  DETAIL_DONE: "詳細入力済", ORIEN_SET: "オリエン日程確定", ORIEN_DONE: "オリエン実施済",
  SUPPORT: "サポート中", PAY_SET: "支払期日確定", PAY_GUIDED: "入金案内済",
  PAYING: "入金処理中", DONE: "完了",
};

const TRANSITIONS = {
  [S.RESERVE]: [S.READY],
  [S.READY]: [S.CONSULTED],
  [S.CONSULTED]: [S.CLOSED, S.REVIEW, S.NOT_TARGET],
  [S.REVIEW]: [S.CONSULTED],
  [S.CLOSED]: [S.DETAIL_DONE],
  [S.DETAIL_DONE]: [S.ORIEN_SET, S.PAY_SET],
  [S.ORIEN_SET]: [S.ORIEN_DONE],
  [S.ORIEN_DONE]: [S.SUPPORT],
  [S.PAY_SET]: [S.PAY_GUIDED],
  [S.PAY_GUIDED]: [S.PAYING],
  [S.PAYING]: [S.DONE],
};

const SC = {
  [S.RESERVE]: C.accent, [S.READY]: "#6366F1", [S.CONSULTED]: C.purple,
  [S.CLOSED]: C.success, [S.REVIEW]: C.warn, [S.NOT_TARGET]: C.danger,
  [S.DETAIL_DONE]: C.blue, [S.ORIEN_SET]: C.teal, [S.ORIEN_DONE]: "#0891B2",
  [S.SUPPORT]: "#059669", [S.PAY_SET]: "#B45309", [S.PAY_GUIDED]: "#D97706",
  [S.PAYING]: "#92400E", [S.DONE]: C.success,
};

// ── UI Components ──
const Badge = ({ children, color = C.accent }) => (
  <span style={{ background: color + "18", color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>{children}</span>
);
const Btn = ({ children, onClick, variant = "primary", size = "md", disabled = false }) => {
  const base = { border: "none", borderRadius: 6, fontWeight: 600, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: 4 };
  const sz = { sm: { fontSize: 12, padding: "4px 10px" }, md: { fontSize: 13, padding: "7px 16px" }, lg: { fontSize: 14, padding: "10px 24px" } };
  const v = { primary: { background: C.accent, color: C.white }, secondary: { background: C.light, color: C.accent }, success: { background: C.success, color: C.white }, danger: { background: "#FEE2E2", color: C.danger }, ghost: { background: "transparent", color: C.sub, border: `1px solid ${C.border}` }, warn: { background: "#FEF3C7", color: "#92400E" } };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...sz[size], ...v[variant] }}>{children}</button>;
};
const Input = ({ label, placeholder, type = "text", value, width = "100%" }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 4 }}>{label}</label>
    {type === "select" ? <select style={{ width, padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, background: C.white }}><option>{value || placeholder}</option></select>
      : type === "textarea" ? <textarea placeholder={placeholder} rows={3} style={{ width, padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
      : <input type={type} placeholder={placeholder} defaultValue={value} style={{ width, padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, boxSizing: "border-box" }} />}
  </div>
);
const Card = ({ children, style = {} }) => <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, ...style }}>{children}</div>;
const PageTitle = ({ title, subtitle, actions }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
    <div><h2 style={{ margin: 0, fontSize: 20, color: C.primary, fontWeight: 700 }}>{title}</h2>{subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: C.sub }}>{subtitle}</p>}</div>
    {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
  </div>
);
const Popup = ({ title, message, onClose, type = "warn" }) => (
  <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
    <div style={{ background: C.white, borderRadius: 12, padding: 28, width: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{type === "warn" ? "\u26A0\uFE0F" : type === "success" ? "\u2705" : "\u2139\uFE0F"}</span>
        <h3 style={{ margin: 0, fontSize: 16, color: C.text }}>{title}</h3>
      </div>
      <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: "0 0 20px", whiteSpace: "pre-line" }}>{message}</p>
      <div style={{ textAlign: "right" }}><Btn onClick={onClose}>閉じる</Btn></div>
    </div>
  </div>
);
const InfoBanner = ({ children, type = "info" }) => {
  const colors = { info: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" }, warn: { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412" }, success: { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534" } };
  const c = colors[type];
  return <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: c.text, marginBottom: 12, lineHeight: 1.6 }}>{children}</div>;
};

// ── Header ──
const Header = ({ screen, onNav, role }) => (
  <div style={{ background: C.primary, color: C.white, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <span style={{ fontWeight: 700, fontSize: 16, cursor: "pointer" }} onClick={() => onNav("dashboard")}>商談管理システム</span>
      <div style={{ display: "flex", gap: 4 }}>
        {[["dashboard", "ダッシュボード"], ["deal_list", "商談一覧"], ["reserve", "新規予約"]].map(([k, v]) => (
          <span key={k} onClick={() => onNav(k)} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, cursor: "pointer", background: screen === k ? "rgba(255,255,255,0.18)" : "transparent", fontWeight: screen === k ? 600 : 400 }}>{v}</span>
        ))}
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12, opacity: 0.7 }}>ロール:</span><Badge color={C.white}>{role}</Badge>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>T</div>
    </div>
  </div>
);

// ── Status Flow Diagram ──
const StatusFlow = ({ status }) => {
  const salesFlow = [S.RESERVE, S.READY, S.CONSULTED];
  const resultOptions = [S.CLOSED, S.REVIEW, S.NOT_TARGET];
  const adminFlow = [S.DETAIL_DONE, S.ORIEN_SET, S.ORIEN_DONE, S.SUPPORT];
  const payFlow = [S.PAY_SET, S.PAY_GUIDED, S.PAYING, S.DONE];
  const allStatuses = [...salesFlow, ...resultOptions, ...adminFlow, ...payFlow];
  const currentIdx = allStatuses.indexOf(status);

  const node = (s) => {
    const isCurrent = s === status;
    const idx = allStatuses.indexOf(s);
    const done = idx >= 0 && currentIdx >= 0 && idx < currentIdx && !([S.REVIEW, S.NOT_TARGET].includes(s) && ![S.REVIEW, S.NOT_TARGET].includes(status));
    return { padding: "4px 10px", borderRadius: 16, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", border: isCurrent ? `2px solid ${SC[s]}` : "2px solid transparent", background: isCurrent ? SC[s] : done ? SC[s] + "22" : "#F3F4F6", color: isCurrent ? C.white : done ? SC[s] : "#9CA3AF", boxShadow: isCurrent ? `0 2px 6px ${SC[s]}44` : "none" };
  };
  const arr = <span style={{ color: "#D1D5DB", fontSize: 12, margin: "0 2px" }}>{"\u2192"}</span>;

  return (
    <Card style={{ marginBottom: 16, padding: "14px 18px" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.sub, marginBottom: 8 }}>業務フロー</div>
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: C.sub, fontWeight: 600, marginRight: 4 }}>営業:</span>
        {salesFlow.map((s, i) => <span key={s} style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={node(s)}>{s}</span>{i < salesFlow.length - 1 && arr}</span>)}
        {arr}
        <span style={{ fontSize: 10, color: C.sub }}>結果報告</span>{arr}
        {resultOptions.map((s, i) => <span key={s} style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={node(s)}>{s}</span>{i < resultOptions.length - 1 && <span style={{ color: "#D1D5DB", fontSize: 10, margin: "0 2px" }}>/</span>}</span>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: C.sub, fontWeight: 600, marginRight: 4 }}>事務:</span>
        <span style={node(S.CLOSED)}>{S.CLOSED}</span>{arr}
        {adminFlow.map((s, i) => <span key={s} style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={node(s)}>{s}</span>{i < adminFlow.length - 1 && arr}</span>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: C.sub, fontWeight: 600, marginRight: 4 }}>支払:</span>
        {payFlow.map((s, i) => <span key={s} style={{ display: "flex", alignItems: "center", gap: 2 }}><span style={node(s)}>{s}</span>{i < payFlow.length - 1 && arr}</span>)}
      </div>
    </Card>
  );
};

// ── Dashboard ──
const Dashboard = ({ onNav, deals }) => {
  const cnt = (s) => deals.filter(d => d.status === s).length;
  const stats = [{ l: "予約/商談", c: cnt(S.RESERVE) + cnt(S.READY) + cnt(S.CONSULTED), color: C.accent }, { l: "成約", c: cnt(S.CLOSED) + cnt(S.DETAIL_DONE) + cnt(S.ORIEN_SET) + cnt(S.ORIEN_DONE) + cnt(S.SUPPORT), color: C.success }, { l: "検討中", c: cnt(S.REVIEW), color: C.warn }, { l: "完了", c: cnt(S.DONE), color: C.teal }];
  const alerts = [
    { text: "利用者「田中一郎」様の予約情報が登録されました。商談準備を進めてください。", type: "info" },
    { text: "利用者「伊藤健太」様の退職予定日まで10日です。社会保険給付金の案内を確認してください。", type: "warn" },
    { text: "利用者「渡辺美咲」様の支払期日まで3日です。入金状況を確認してください。", type: "warn" },
    { text: "利用者「鈴木花子」様の詳細情報が未入力です。（事務担当）", type: "info" },
  ];
  return (
    <div style={{ padding: 24 }}>
      <PageTitle title="ダッシュボード" subtitle="案件サマリーと通知" actions={<Btn onClick={() => onNav("reserve")}>＋ 新規予約</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {stats.map(s => <Card key={s.l} style={{ textAlign: "center", padding: 16 }}><div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.c}</div><div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{s.l}</div></Card>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><h3 style={{ margin: 0, fontSize: 14, color: C.text }}>最近の案件</h3><Btn variant="ghost" size="sm" onClick={() => onNav("deal_list")}>一覧を見る →</Btn></div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: `2px solid ${C.light}` }}>{["ID", "利用者名", "担当", "ステータス", "退職予定日"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: C.sub, fontWeight: 600, fontSize: 11 }}>{h}</th>)}</tr></thead>
            <tbody>{deals.slice(0, 5).map(d => (
              <tr key={d.id} onClick={() => onNav("detail", d.id)} style={{ borderBottom: `1px solid ${C.light}`, cursor: "pointer" }}>
                <td style={{ padding: "8px", fontFamily: "monospace", fontSize: 11 }}>{d.id}</td>
                <td style={{ padding: "8px", fontWeight: 600 }}>{d.name}</td>
                <td style={{ padding: "8px" }}>{d.assignee}</td>
                <td style={{ padding: "8px" }}><Badge color={SC[d.status]}>{d.status}</Badge></td>
                <td style={{ padding: "8px", color: C.sub }}>{d.retireDate}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, color: C.text }}>通知</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {alerts.map((n, i) => <div key={i} style={{ padding: "10px 12px", borderRadius: 8, fontSize: 12, lineHeight: 1.5, background: n.type === "warn" ? "#FEF3C7" : C.light, borderLeft: `3px solid ${n.type === "warn" ? C.warn : C.accent}` }}>{n.text}</div>)}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ── Reserve (新規予約) ──
const Reserve = ({ onNav, onAdd }) => (
  <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
    <PageTitle title="新規予約登録" subtitle="利用者の予約情報を入力してください" actions={<><Btn variant="ghost" onClick={() => onNav("dashboard")}>キャンセル</Btn><Btn onClick={onAdd}>予約登録</Btn></>} />
    <Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="利用者名 *" placeholder="氏名を入力" />
        <Input label="担当 *" type="select" value="佐藤" />
        <Input label="商談予定日 *" type="date" value="2026-04-20" />
        <Input label="退職予定日 *" type="date" placeholder="利用者の退職予定日" />
        <Input label="流入 *" type="select" placeholder="Web / 紹介 / 電話" />
        <Input label="Googleカレンダー連携" type="select" value="自動登録する" />
      </div>
      <Input label="メモ" type="textarea" placeholder="予約に関する備考（給付金の種類・利用者の状況等）..." />
      <InfoBanner type="info">予約登録後、Googleカレンダーに自動連携され、担当者に予約情報ポップアップが表示されます。</InfoBanner>
    </Card>
  </div>
);

// ── Deal List ──
const DealList = ({ onNav, deals }) => (
  <div style={{ padding: 24 }}>
    <PageTitle title="商談一覧" subtitle={`全 ${deals.length} 件`} actions={<Btn onClick={() => onNav("reserve")}>＋ 新規予約</Btn>} />
    <Card style={{ padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}><input placeholder="キーワード検索（ID・利用者名・担当）" style={{ width: "100%", padding: "7px 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, boxSizing: "border-box" }} /></div>
        <select style={{ padding: "7px 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13 }}><option>全ステータス</option></select>
        <Btn variant="secondary">検索</Btn>
      </div>
    </Card>
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ background: C.light }}>{["ID", "利用者名", "担当", "退職予定日", "流入", "ステータス"].map(h => <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: C.text, fontWeight: 600, fontSize: 12 }}>{h}</th>)}</tr></thead>
        <tbody>{deals.map(d => (
          <tr key={d.id} onClick={() => onNav("detail", d.id)} style={{ borderBottom: `1px solid ${C.light}`, cursor: "pointer" }}>
            <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 11 }}>{d.id}</td>
            <td style={{ padding: "10px 12px", fontWeight: 600 }}>{d.name}</td>
            <td style={{ padding: "10px 12px" }}>{d.assignee}</td>
            <td style={{ padding: "10px 12px", color: C.sub }}>{d.retireDate}</td>
            <td style={{ padding: "10px 12px" }}>{d.source}</td>
            <td style={{ padding: "10px 12px" }}><Badge color={SC[d.status]}>{d.status}</Badge></td>
          </tr>
        ))}</tbody>
      </table>
    </Card>
  </div>
);

// ── Deal Detail ──
const Detail = ({ onNav, deal, role, onStatus, onUpdate }) => {
  const [popup, setPopup] = useState(null);
  const isEnd = [S.NOT_TARGET, S.DONE].includes(deal.status);
  const next = TRANSITIONS[deal.status] || [];

  const actions = () => {
    if (isEnd) return <span style={{ fontSize: 13, color: C.sub }}>この案件は「{deal.status}」です。</span>;
    const btns = [];

    // 営業 actions
    if (role === "営業") {
      if (deal.status === S.RESERVE) btns.push(<Btn key="prep" onClick={() => onStatus(deal.id, S.READY)}>商談準備開始</Btn>);
      if (deal.status === S.READY) btns.push(<Btn key="consult" onClick={() => onNav("consult", deal.id)}>商談実施・結果入力</Btn>);
      if (deal.status === S.CONSULTED) btns.push(<Btn key="result" onClick={() => onNav("result", deal.id)}>商談結果報告</Btn>);
      if (deal.status === S.REVIEW) {
        btns.push(<Btn key="retry" variant="secondary" onClick={() => onStatus(deal.id, S.CONSULTED)}>再商談</Btn>);
        btns.push(<Btn key="followup" variant="warn" onClick={() => setPopup({ title: "検討・時期未定フォローアップ", message: `利用者「${deal.name}」様は現在「検討中」です。\n\n退職予定日: ${deal.retireDate}\n\n後追い対応として、定期的なフォローアップ連絡を行ってください。\n社会保険給付金の申請期限にご注意ください。`, type: "warn" })}>後追い確認</Btn>);
      }
    }
    // 事務 actions
    if (role === "事務") {
      if (deal.status === S.CLOSED) btns.push(<Btn key="det" onClick={() => onNav("detail_input", deal.id)}>詳細情報入力</Btn>);
      if (deal.status === S.DETAIL_DONE) {
        btns.push(<Btn key="orien" onClick={() => onNav("orien", deal.id)}>オリエン日程入力</Btn>);
        btns.push(<Btn key="paydue" variant="secondary" onClick={() => onNav("pay_due", deal.id)}>支払期日設定</Btn>);
      }
      if (deal.status === S.ORIEN_SET) btns.push(<Btn key="orien_exec" onClick={() => onStatus(deal.id, S.ORIEN_DONE)}>オリエン実施完了</Btn>);
      if (deal.status === S.ORIEN_DONE) btns.push(<Btn key="support" variant="success" onClick={() => onStatus(deal.id, S.SUPPORT)}>サポートスタート</Btn>);
      if (deal.status === S.PAY_SET) btns.push(<Btn key="guide" onClick={() => { onStatus(deal.id, S.PAY_GUIDED); }}>入金案内送信</Btn>);
      if (deal.status === S.PAY_GUIDED || deal.status === S.PAYING) btns.push(<Btn key="pay" onClick={() => onNav("payment", deal.id)}>入金入力・支払管理</Btn>);
    }
    if (btns.length === 0) return <span style={{ fontSize: 13, color: C.sub }}>現在のロール「{role}」ではこのステータスで操作できません。</span>;
    return btns;
  };

  // Retirement alert
  const retireAlert = (() => {
    if (!deal.retireDate || isEnd) return null;
    const diff = Math.ceil((new Date(deal.retireDate.replace(/\//g, "-")) - new Date("2026-04-15")) / 86400000);
    if (diff > 0 && diff <= 14) return (
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{"\u26A0\uFE0F"}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 4 }}>利用者の退職予定日まであと {diff} 日（{deal.retireDate}）</div>
          <div style={{ fontSize: 12, color: "#B91C1C", lineHeight: 1.6 }}>社会保険給付金の申請案内をご確認ください。雇用保険・傷病手当金・再就職手当等の対応が必要です。</div>
        </div>
      </div>
    );
    return null;
  })();

  return (
    <div style={{ padding: 24, maxWidth: 920, margin: "0 auto" }}>
      {popup && <Popup {...popup} onClose={() => setPopup(null)} />}
      <PageTitle title="案件詳細" subtitle={`${deal.id} — ${deal.name}`} actions={<Btn variant="ghost" onClick={() => onNav("deal_list")}>← 一覧へ戻る</Btn>} />
      <StatusFlow status={deal.status} />
      {retireAlert}
      {!isEnd && next.length > 0 && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>次のステータス:</span>{next.map(s => <Badge key={s} color={SC[s]}>{s}</Badge>)}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, color: C.text }}>基本情報</h3>
          {[["ID", deal.id], ["利用者名", deal.name], ["担当", deal.assignee], ["商談日", deal.date], ["退職予定日", deal.retireDate], ["流入", deal.source], ["ステータス", deal.status]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", borderBottom: `1px solid ${C.light}`, padding: "8px 0", fontSize: 13 }}>
              <span style={{ width: 110, color: C.sub, fontWeight: 600, flexShrink: 0 }}>{k}</span>
              <span>{k === "ステータス" ? <Badge color={SC[v]}>{v}</Badge> : v || "—"}</span>
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, color: C.text }}>詳細情報</h3>
          {[["メール", deal.email], ["電話番号", deal.phone], ["成約プラン", deal.plan], ["オリエン日", deal.orienDate], ["支払期日", deal.payDueDate], ["入金状況", deal.payments?.length > 0 ? `${deal.payments.length}回入金済` : "未処理"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", borderBottom: `1px solid ${C.light}`, padding: "8px 0", fontSize: 13 }}>
              <span style={{ width: 110, color: C.sub, fontWeight: 600, flexShrink: 0 }}>{k}</span><span>{v || "未入力"}</span>
            </div>
          ))}
          {deal.memo && <div style={{ marginTop: 12 }}><h4 style={{ margin: "0 0 6px", fontSize: 12, color: C.sub }}>メモ</h4><div style={{ background: C.bg, borderRadius: 6, padding: 10, fontSize: 13, lineHeight: 1.6 }}>{deal.memo}</div></div>}
        </Card>
      </div>
      <Card style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: C.text }}>アクション（{role}）</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>{actions()}</div>
      </Card>
    </div>
  );
};

// ── Consult & Result ──
const Consult = ({ onNav, deal, onStatus }) => (
  <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
    <PageTitle title="商談実施・情報確認" subtitle={`${deal.id} — ${deal.name}`} actions={<Btn variant="ghost" onClick={() => onNav("detail", deal.id)}>← 戻る</Btn>} />
    <StatusFlow status={deal.status} />
    <Card>
      <h3 style={{ margin: "0 0 14px", fontSize: 14, color: C.text }}>予約情報の確認</h3>
      <div style={{ background: C.bg, borderRadius: 8, padding: 14, marginBottom: 16 }}>
        {[["利用者名", deal.name], ["退職予定日", deal.retireDate], ["流入", deal.source], ["担当", deal.assignee]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", padding: "6px 0", fontSize: 13 }}><span style={{ width: 110, color: C.sub, fontWeight: 600 }}>{k}</span><span>{v}</span></div>
        ))}
      </div>
      <Input label="商談内容" type="textarea" placeholder="商談の内容を記録..." />
      <Input label="利用者の状況" type="textarea" placeholder="退職理由・健康状態・希望する給付金等..." />
      <InfoBanner type="info">情報確認後、送信すると「商談済」になり、結果報告（成約/検討/対象外）に進めます。</InfoBanner>
      <Btn onClick={() => { onStatus(deal.id, S.CONSULTED); onNav("detail", deal.id); }}>送信（商談済へ）</Btn>
    </Card>
  </div>
);

const Result = ({ onNav, deal, onStatus }) => (
  <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
    <PageTitle title="商談結果報告" subtitle={`${deal.id} — ${deal.name}`} actions={<Btn variant="ghost" onClick={() => onNav("detail", deal.id)}>← 戻る</Btn>} />
    <StatusFlow status={deal.status} />
    <Card>
      <h3 style={{ margin: "0 0 14px", fontSize: 14, color: C.text }}>商談結果を選択してください</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div onClick={() => { onStatus(deal.id, S.CLOSED); onNav("detail", deal.id); }} style={{ border: `2px solid ${C.success}`, borderRadius: 10, padding: 16, cursor: "pointer", background: "#F0FDF4" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.success, marginBottom: 4 }}>成約</div>
          <div style={{ fontSize: 12, color: C.sub }}>利用者がサービスを契約。事務フロー（詳細入力・オリエン・支払い管理）へ進みます。</div>
        </div>
        <div onClick={() => { onStatus(deal.id, S.REVIEW); onNav("detail", deal.id); }} style={{ border: `2px solid ${C.warn}`, borderRadius: 10, padding: 16, cursor: "pointer", background: "#FFF7ED" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.warn, marginBottom: 4 }}>検討 / 時期未定</div>
          <div style={{ fontSize: 12, color: C.sub }}>利用者が検討中。後追いフォローアップを行い、再商談が可能です。</div>
        </div>
        <div onClick={() => { onStatus(deal.id, S.NOT_TARGET); onNav("detail", deal.id); }} style={{ border: `2px solid ${C.danger}`, borderRadius: 10, padding: 16, cursor: "pointer", background: "#FEF2F2" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.danger, marginBottom: 4 }}>対象外</div>
          <div style={{ fontSize: 12, color: C.sub }}>社会保険給付金の受給要件を満たさない等の理由で対象外。案件を終了します。</div>
        </div>
      </div>
    </Card>
  </div>
);

// ── Detail Input (事務) ──
const DetailInput = ({ onNav, deal, onStatus, onUpdate }) => (
  <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
    <PageTitle title="詳細情報入力（事務）" subtitle={`${deal.id} — ${deal.name}`} actions={<Btn variant="ghost" onClick={() => onNav("detail", deal.id)}>← 戻る</Btn>} />
    <StatusFlow status={deal.status} />
    <Card>
      <h3 style={{ margin: "0 0 14px", fontSize: 14, color: C.text }}>顧客詳細情報</h3>
      <Input label="メールアドレス *" type="email" placeholder="example@mail.com" />
      <Input label="電話番号 *" placeholder="090-0000-0000" />
      <Input label="成約プラン *" type="select" placeholder="プランを選択" />
      <InfoBanner type="info">確定後「詳細入力済」になり、オリエン日程入力・支払期日設定に進めます。売上報告も作成されます。</InfoBanner>
      <Btn onClick={() => { onUpdate(deal.id, { email: "tanaka@example.com", phone: "090-1234-5678", plan: "スタンダードプラン" }); onStatus(deal.id, S.DETAIL_DONE); onNav("detail", deal.id); }}>確定（売上報告作成）</Btn>
    </Card>
  </div>
);

// ── Orientation ──
const Orien = ({ onNav, deal, onStatus, onUpdate }) => (
  <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
    <PageTitle title="オリエン日程入力" subtitle={`${deal.id} — ${deal.name}`} actions={<Btn variant="ghost" onClick={() => onNav("detail", deal.id)}>← 戻る</Btn>} />
    <StatusFlow status={deal.status} />
    <Card>
      <h3 style={{ margin: "0 0 14px", fontSize: 14, color: C.text }}>オリエンテーション日程</h3>
      <Input label="オリエン実施日 *" type="date" />
      <Input label="実施方法" type="select" value="オンライン" />
      <Input label="備考" type="textarea" placeholder="オリエンに関する備考..." />
      <InfoBanner type="info">日程確定後、利用者へオリエン案内が送信されます。実施完了後に「サポートスタート」へ進みます。</InfoBanner>
      <Btn onClick={() => { onUpdate(deal.id, { orienDate: "2026/05/01" }); onStatus(deal.id, S.ORIEN_SET); onNav("detail", deal.id); }}>日程確定</Btn>
    </Card>
  </div>
);

// ── Pay Due Date ──
const PayDue = ({ onNav, deal, onStatus, onUpdate }) => {
  const [showPopup, setShowPopup] = useState(false);
  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      {showPopup && <Popup title="支払期日決定通知" message={`利用者「${deal.name}」様の支払期日が設定されました。\n営業担当・事務担当へ通知が送信されました。\n\n支払期日の3日前にリマインド通知が自動送信されます。`} type="success" onClose={() => { setShowPopup(false); onNav("detail", deal.id); }} />}
      <PageTitle title="支払期日設定" subtitle={`${deal.id} — ${deal.name}`} actions={<Btn variant="ghost" onClick={() => onNav("detail", deal.id)}>← 戻る</Btn>} />
      <StatusFlow status={deal.status} />
      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 14, color: C.text }}>支払期日の決定</h3>
        <Input label="支払期日 *" type="date" />
        <Input label="支払総額 *" placeholder="金額を入力" />
        <Input label="分割回数" type="select" value="一括" />
        <Input label="備考" type="textarea" placeholder="支払いに関する備考..." />
        <InfoBanner type="warn">支払期日決定後、事務・営業担当にポップアップ通知が送信されます。期日3日前にもリマインドが届きます。</InfoBanner>
        <Btn onClick={() => { onUpdate(deal.id, { payDueDate: "2026/05/15" }); onStatus(deal.id, S.PAY_SET); setShowPopup(true); }}>支払期日を確定</Btn>
      </Card>
    </div>
  );
};

// ── Payment ──
const Payment = ({ onNav, deal, onStatus, onUpdate }) => {
  const [payments, setPayments] = useState(deal.payments || []);
  const [showAdd, setShowAdd] = useState(false);
  const total = 150000;
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const remain = total - paid;
  const pct = Math.min(100, Math.round(paid / total * 100));
  const full = remain <= 0;

  const addPay = () => {
    const np = { id: payments.length + 1, date: "2026/04/15", amount: remain >= 50000 ? 50000 : remain, method: "銀行振込" };
    const updated = [...payments, np];
    setPayments(updated);
    onUpdate(deal.id, { payments: updated });
    if (deal.status !== S.PAYING) onStatus(deal.id, S.PAYING);
    setShowAdd(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      <PageTitle title="支払い管理 / 入金入力" subtitle={`${deal.id} — ${deal.name}`} actions={<Btn variant="ghost" onClick={() => onNav("detail", deal.id)}>← 戻る</Btn>} />
      <StatusFlow status={deal.status} />
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 14, color: C.text }}>支払サマリー</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ background: C.bg, borderRadius: 8, padding: 14, textAlign: "center" }}><div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>合計金額</div><div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{"\u00A5"}{total.toLocaleString()}</div></div>
          <div style={{ background: "#F0FDF4", borderRadius: 8, padding: 14, textAlign: "center" }}><div style={{ fontSize: 11, color: C.success, marginBottom: 4 }}>入金済み</div><div style={{ fontSize: 22, fontWeight: 700, color: C.success }}>{"\u00A5"}{paid.toLocaleString()}</div></div>
          <div style={{ background: remain > 0 ? "#FEF3C7" : "#F0FDF4", borderRadius: 8, padding: 14, textAlign: "center" }}><div style={{ fontSize: 11, color: remain > 0 ? C.warn : C.success, marginBottom: 4 }}>残額</div><div style={{ fontSize: 22, fontWeight: 700, color: remain > 0 ? C.warn : C.success }}>{"\u00A5"}{Math.max(0, remain).toLocaleString()}</div></div>
        </div>
        <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", fontSize: 11, color: C.sub }}><span>入金進捗</span><span>{pct}%</span></div>
        <div style={{ height: 10, background: "#E5E7EB", borderRadius: 5, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: full ? C.success : C.accent, borderRadius: 5, transition: "width .3s" }} /></div>
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: C.text }}>入金履歴</h3>
          {!full && <Btn size="sm" onClick={() => setShowAdd(true)}>＋ 入金入力</Btn>}
        </div>
        {payments.length === 0 ? <div style={{ textAlign: "center", padding: "20px 0", color: C.sub, fontSize: 13 }}>入金履歴はありません</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: `2px solid ${C.light}` }}>{["回", "入金日", "入金額", "支払方法", "累計"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: C.sub, fontWeight: 600, fontSize: 11 }}>{h}</th>)}</tr></thead>
            <tbody>{payments.map((p, i) => { const cum = payments.slice(0, i + 1).reduce((s, x) => s + x.amount, 0); return (
              <tr key={p.id} style={{ borderBottom: `1px solid ${C.light}` }}>
                <td style={{ padding: "8px", fontWeight: 600 }}>{p.id}回目</td><td style={{ padding: "8px", color: C.sub }}>{p.date}</td>
                <td style={{ padding: "8px", fontWeight: 600 }}>{"\u00A5"}{p.amount.toLocaleString()}</td><td style={{ padding: "8px" }}>{p.method}</td>
                <td style={{ padding: "8px" }}>{"\u00A5"}{cum.toLocaleString()}</td>
              </tr>); })}</tbody>
          </table>
        )}
      </Card>
      {showAdd && (
        <Card style={{ marginBottom: 16, border: `2px solid ${C.accent}` }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, color: C.accent }}>入金入力</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Input label="入金日 *" type="date" value="2026-04-15" /><Input label="入金額 *" placeholder={`残額: \u00A5${remain.toLocaleString()}`} />
            <Input label="支払方法 *" type="select" value="銀行振込" /><Input label="入金確認者" type="select" value="事務A" />
          </div>
          <Input label="備考" type="textarea" placeholder="振込名義、領収書番号等" />
          <div style={{ display: "flex", gap: 8 }}><Btn onClick={addPay}>入金を記録</Btn><Btn variant="ghost" onClick={() => setShowAdd(false)}>キャンセル</Btn></div>
        </Card>
      )}
      <Card>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: C.text }}>代理店紹介料管理</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="代理店名" type="select" placeholder="代理店を選択" /><Input label="紹介料率" placeholder="例: 10%" />
          <Input label="紹介料額" placeholder="自動計算" /><Input label="支払ステータス" type="select" value="未払い" />
        </div>
        {full && <InfoBanner type="success">全額入金が完了しています。「完了」に進めることができます。</InfoBanner>}
        <Btn variant="success" disabled={!full} onClick={() => { onStatus(deal.id, S.DONE); onNav("detail", deal.id); }}>{full ? "案件を完了にする" : "完了にする（全額入金後に有効）"}</Btn>
      </Card>
    </div>
  );
};

// ── Login ──
const Login = ({ onNav }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)` }}>
    <div style={{ background: C.white, borderRadius: 16, padding: 40, width: 380, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, color: C.primary }}>商談管理システム</h1>
      <p style={{ color: C.sub, fontSize: 12, margin: "0 0 4px" }}>社会保険給付金サポート</p>
      <p style={{ color: C.sub, fontSize: 13, margin: "0 0 28px" }}>ログインして続行してください</p>
      <Btn size="lg" onClick={() => onNav("dashboard")}>SSO でログイン</Btn>
    </div>
  </div>
);

// ── Data ──
const INIT = [
  { id: "D-20260415-001", name: "田中一郎", assignee: "佐藤", date: "2026/04/15", retireDate: "2026/04/29", source: "Web", status: S.RESERVE, email: "", phone: "", plan: "", orienDate: "", payDueDate: "", memo: "Webからの問い合わせ", payments: [] },
  { id: "D-20260414-002", name: "鈴木花子", assignee: "山本", date: "2026/04/14", retireDate: "2026/05/31", source: "紹介", status: S.CLOSED, email: "", phone: "", plan: "", orienDate: "", payDueDate: "", memo: "紹介経由。傷病手当金の相談あり", payments: [] },
  { id: "D-20260413-003", name: "高橋太郎", assignee: "佐藤", date: "2026/04/13", retireDate: "2026/06/15", source: "電話", status: S.DETAIL_DONE, email: "takahashi@example.com", phone: "080-9876-5432", plan: "プレミアムプラン", orienDate: "", payDueDate: "", memo: "", payments: [] },
  { id: "D-20260412-004", name: "渡辺美咲", assignee: "田中", date: "2026/04/12", retireDate: "2026/05/10", source: "Web", status: S.PAY_SET, email: "watanabe@example.com", phone: "070-1111-2222", plan: "スタンダードプラン", orienDate: "2026/04/25", payDueDate: "2026/05/15", memo: "", payments: [] },
  { id: "D-20260411-005", name: "伊藤健太", assignee: "山本", date: "2026/04/11", retireDate: "2026/04/25", source: "紹介", status: S.REVIEW, email: "", phone: "", plan: "", orienDate: "", payDueDate: "", memo: "検討中。再連絡予定", payments: [] },
  { id: "D-20260410-006", name: "中村優子", assignee: "佐藤", date: "2026/04/10", retireDate: "2026/03/31", source: "電話", status: S.DONE, email: "nakamura@example.com", phone: "090-3333-4444", plan: "スタンダードプラン", orienDate: "2026/03/15", payDueDate: "2026/03/25", memo: "", payments: [{ id: 1, date: "2026/03/20", amount: 75000, method: "銀行振込" }, { id: 2, date: "2026/03/25", amount: 75000, method: "銀行振込" }] },
  { id: "D-20260409-007", name: "小林大輔", assignee: "田中", date: "2026/04/09", retireDate: "2026/05/20", source: "Web", status: S.NOT_TARGET, email: "", phone: "", plan: "", orienDate: "", payDueDate: "", memo: "受給要件を満たさず対象外", payments: [] },
];

// ── App ──
export default function App() {
  const [screen, setScreen] = useState("login");
  const [role, setRole] = useState("営業");
  const [deals, setDeals] = useState(INIT);
  const [selId, setSelId] = useState(INIT[0].id);

  const nav = (s, id) => { if (id) setSelId(id); setScreen(s); };
  const sel = deals.find(d => d.id === selId) || deals[0];
  const chgStatus = (id, st) => setDeals(p => p.map(d => d.id === id ? { ...d, status: st } : d));
  const updDeal = (id, u) => setDeals(p => p.map(d => d.id === id ? { ...d, ...u } : d));
  const addDeal = () => {
    const seq = String(deals.length + 1).padStart(3, "0");
    const newId = `D-20260415-${seq}`;
    const nd = { id: newId, name: "新規利用者", assignee: "佐藤", date: "2026/04/15", retireDate: "", source: "Web", status: S.RESERVE, email: "", phone: "", plan: "", orienDate: "", payDueDate: "", memo: "", payments: [] };
    setDeals(p => [nd, ...p]);
    setSelId(newId);
    setScreen("detail");
  };

  const screens = {
    login: <Login onNav={nav} />,
    dashboard: <Dashboard onNav={nav} deals={deals} />,
    reserve: <Reserve onNav={nav} onAdd={addDeal} />,
    deal_list: <DealList onNav={nav} deals={deals} />,
    detail: <Detail onNav={nav} deal={sel} role={role} onStatus={chgStatus} onUpdate={updDeal} />,
    consult: <Consult onNav={nav} deal={sel} onStatus={chgStatus} />,
    result: <Result onNav={nav} deal={sel} onStatus={chgStatus} />,
    detail_input: <DetailInput onNav={nav} deal={sel} onStatus={chgStatus} onUpdate={updDeal} />,
    orien: <Orien onNav={nav} deal={sel} onStatus={chgStatus} onUpdate={updDeal} />,
    pay_due: <PayDue onNav={nav} deal={sel} onStatus={chgStatus} onUpdate={updDeal} />,
    payment: <Payment onNav={nav} deal={sel} onStatus={chgStatus} onUpdate={updDeal} />,
  };

  if (screen === "login") return screens.login;
  const names = { dashboard: "ダッシュボード", reserve: "新規予約", deal_list: "商談一覧", detail: "案件詳細", consult: "商談実施", result: "結果報告", detail_input: "詳細入力", orien: "オリエン", pay_due: "支払期日", payment: "支払管理" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
      <Header screen={screen} onNav={nav} role={role} />
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "6px 24px", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
        <span style={{ color: C.sub, fontWeight: 600 }}>ロール切替:</span>
        {["営業", "事務"].map(r => <button key={r} onClick={() => setRole(r)} style={{ padding: "3px 12px", borderRadius: 14, border: `1px solid ${role === r ? C.accent : C.border}`, background: role === r ? C.accent : C.white, color: role === r ? C.white : C.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{r}</button>)}
        <span style={{ marginLeft: "auto", color: C.sub }}>現在: <strong style={{ color: C.text }}>{names[screen] || screen}</strong></span>
      </div>
      {screens[screen]}
    </div>
  );
}
