const { useState } = React;

// --- Color & Style tokens ---
const C = {
  primary: "#1F3864",
  accent: "#2B5797",
  light: "#D6E4F0",
  bg: "#F5F7FA",
  white: "#FFFFFF",
  border: "#D1D5DB",
  text: "#1F2937",
  sub: "#6B7280",
  success: "#059669",
  warn: "#D97706",
  danger: "#DC2626",
  purple: "#7C3AED",
  blue: "#2563EB",
  teal: "#0D9488",
};

// --- Status Flow Definition ---
const STATUS = {
  NEW: "新規",
  REVIEWING: "検討中",
  REPORTED: "ライン報告済",
  DETAIL_DONE: "詳細入力済",
  CONFIRMED: "管理確認済",
  PAYING: "支払処理中",
  STORE_SET: "付与店確定",
  WON: "成約",
  LOST: "失注",
};

// Valid transitions: key = from, value = array of possible "to" statuses
const TRANSITIONS = {
  [STATUS.NEW]: [STATUS.REVIEWING],
  [STATUS.REVIEWING]: [STATUS.REPORTED, STATUS.LOST],
  [STATUS.REPORTED]: [STATUS.DETAIL_DONE],
  [STATUS.DETAIL_DONE]: [STATUS.CONFIRMED],
  [STATUS.CONFIRMED]: [STATUS.PAYING, STATUS.STORE_SET],
  [STATUS.PAYING]: [STATUS.WON],
  [STATUS.STORE_SET]: [STATUS.WON],
};

const STATUS_COLOR = {
  [STATUS.NEW]: C.accent,
  [STATUS.REVIEWING]: C.warn,
  [STATUS.REPORTED]: C.purple,
  [STATUS.DETAIL_DONE]: C.blue,
  [STATUS.CONFIRMED]: C.teal,
  [STATUS.PAYING]: "#B45309",
  [STATUS.STORE_SET]: "#059669",
  [STATUS.WON]: C.success,
  [STATUS.LOST]: C.danger,
};

// Main flow path (top row of the flow diagram)
const MAIN_FLOW = [STATUS.NEW, STATUS.REVIEWING, STATUS.REPORTED, STATUS.DETAIL_DONE, STATUS.CONFIRMED, STATUS.PAYING, STATUS.WON];

// --- Shared UI components ---
const Badge = ({ children, color = C.accent }) => (
  <span style={{ background: color + "18", color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>
    {children}
  </span>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", disabled = false }) => {
  const base = { border: "none", borderRadius: 6, fontWeight: 600, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all .15s", display: "inline-flex", alignItems: "center", gap: 4 };
  const sizes = { sm: { fontSize: 12, padding: "4px 10px" }, md: { fontSize: 13, padding: "7px 16px" }, lg: { fontSize: 14, padding: "10px 24px" } };
  const variants = {
    primary: { background: C.accent, color: C.white },
    secondary: { background: C.light, color: C.accent },
    success: { background: C.success, color: C.white },
    danger: { background: "#FEE2E2", color: C.danger },
    ghost: { background: "transparent", color: C.sub, border: `1px solid ${C.border}` },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...sizes[size], ...variants[variant] }}>{children}</button>;
};

const Input = ({ label, placeholder, type = "text", value, width = "100%" }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 4 }}>{label}</label>
    {type === "select" ? (
      <select style={{ width, padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, color: value ? C.text : C.sub, background: C.white }}>
        <option>{value || placeholder}</option>
      </select>
    ) : type === "textarea" ? (
      <textarea placeholder={placeholder} rows={3} style={{ width, padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
    ) : (
      <input type={type} placeholder={placeholder} defaultValue={value} style={{ width, padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, boxSizing: "border-box" }} />
    )}
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, ...style }}>{children}</div>
);

const Header = ({ currentScreen, onNavigate, role }) => (
  <div style={{ background: C.primary, color: C.white, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <span style={{ fontWeight: 700, fontSize: 16, cursor: "pointer" }} onClick={() => onNavigate("dashboard")}>商談管理システム</span>
      <div style={{ display: "flex", gap: 4 }}>
        {["dashboard", "deal_list", "deal_input"].map((s) => (
          <span key={s} onClick={() => onNavigate(s)} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, cursor: "pointer", background: currentScreen === s ? "rgba(255,255,255,0.18)" : "transparent", fontWeight: currentScreen === s ? 600 : 400 }}>
            {{ dashboard: "ダッシュボード", deal_list: "商談一覧", deal_input: "新規商談" }[s]}
          </span>
        ))}
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12, opacity: 0.7 }}>ロール:</span>
      <Badge color={C.white}>{role}</Badge>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>T</div>
    </div>
  </div>
);

const PageTitle = ({ title, subtitle, actions }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
    <div>
      <h2 style={{ margin: 0, fontSize: 20, color: C.primary, fontWeight: 700 }}>{title}</h2>
      {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: C.sub }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
  </div>
);

const Popup = ({ title, message, onClose, type = "warn" }) => (
  <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
    <div style={{ background: C.white, borderRadius: 12, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{type === "warn" ? "\u26A0\uFE0F" : type === "success" ? "\u2705" : "\u2139\uFE0F"}</span>
        <h3 style={{ margin: 0, fontSize: 16, color: C.text }}>{title}</h3>
      </div>
      <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: "0 0 20px", whiteSpace: "pre-line" }}>{message}</p>
      <div style={{ textAlign: "right" }}><Btn onClick={onClose}>閉じる</Btn></div>
    </div>
  </div>
);

const StatusFlowDiagram = ({ currentStatus }) => {
  const isTerminal = currentStatus === STATUS.WON || currentStatus === STATUS.LOST;
  const mainIdx = MAIN_FLOW.indexOf(currentStatus);
  const isOnMain = mainIdx >= 0;
  const isStoreSet = currentStatus === STATUS.STORE_SET;

  const nodeStyle = (status) => {
    const isCurrent = status === currentStatus;
    const isCompleted = isOnMain && MAIN_FLOW.indexOf(status) >= 0 && MAIN_FLOW.indexOf(status) < mainIdx;
    const isCompletedStore = isStoreSet && [STATUS.NEW, STATUS.REVIEWING, STATUS.REPORTED, STATUS.DETAIL_DONE, STATUS.CONFIRMED].includes(status);
    const isCompletedLost = currentStatus === STATUS.LOST && [STATUS.NEW, STATUS.REVIEWING].includes(status) && status !== STATUS.REVIEWING;
    const isCompletedWon = currentStatus === STATUS.WON;
    const done = isCompleted || isCompletedStore || (currentStatus === STATUS.LOST && status === STATUS.NEW) || isCompletedWon;

    return {
      padding: "5px 12px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
      border: isCurrent ? `2px solid ${STATUS_COLOR[status]}` : "2px solid transparent",
      background: isCurrent ? STATUS_COLOR[status] : done ? STATUS_COLOR[status] + "22" : "#F3F4F6",
      color: isCurrent ? C.white : done ? STATUS_COLOR[status] : "#9CA3AF",
      boxShadow: isCurrent ? `0 2px 8px ${STATUS_COLOR[status]}44` : "none",
    };
  };

  const arrow = (dim = false) => (
    <span style={{ color: dim ? "#E5E7EB" : "#9CA3AF", fontSize: 14, margin: "0 2px" }}>{"\u2192"}</span>
  );

  return (
    <Card style={{ marginBottom: 16, padding: "16px 20px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 10 }}>ステータスフロー</div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap", marginBottom: 8 }}>
        {MAIN_FLOW.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={nodeStyle(s)}>{s}</div>
            {i < MAIN_FLOW.length - 1 && arrow()}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 40, marginTop: 4, paddingLeft: 4 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ fontSize: 10, color: C.sub, marginBottom: -2 }}>{"\u2502"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: C.sub }}>検討中</span>
            {arrow()}
            <div style={nodeStyle(STATUS.LOST)}>{STATUS.LOST}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ fontSize: 10, color: C.sub, marginBottom: -2 }}>{"\u2502"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: C.sub }}>管理確認済</span>
            {arrow()}
            <div style={nodeStyle(STATUS.STORE_SET)}>{STATUS.STORE_SET}</div>
            {arrow()}
            <div style={{ ...nodeStyle(STATUS.WON), ...(currentStatus !== STATUS.WON ? { opacity: isStoreSet ? 1 : 0.5 } : {}) }}>{STATUS.WON}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const DashboardScreen = ({ onNavigate, deals }) => {
  const countByStatus = (s) => deals.filter((d) => d.status === s).length;
  const recentDeals = deals.slice(0, 5);

  return (
    <div style={{ padding: 24 }}>
      <PageTitle title="ダッシュボード" subtitle="商談状況のサマリと最近の案件" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 20 }}>
        {[
          ["新規", countByStatus(STATUS.NEW), C.accent],
          ["検討中", countByStatus(STATUS.REVIEWING), C.warn],
          ["進行中", deals.filter((d) => [STATUS.REPORTED, STATUS.DETAIL_DONE, STATUS.CONFIRMED, STATUS.PAYING, STATUS.STORE_SET].includes(d.status)).length, C.purple],
          ["成約", countByStatus(STATUS.WON), C.success],
        ].map(([label, value, color]) => (
          <Card key={label}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>最近の商談</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: C.sub }}>
              <th style={{ padding: "10px 8px" }}>商談ID</th>
              <th style={{ padding: "10px 8px" }}>顧客名</th>
              <th style={{ padding: "10px 8px" }}>担当</th>
              <th style={{ padding: "10px 8px" }}>ステータス</th>
              <th style={{ padding: "10px 8px" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {recentDeals.map((deal) => (
              <tr key={deal.id} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: "12px 8px" }}>{deal.id}</td>
                <td style={{ padding: "12px 8px" }}>{deal.name}</td>
                <td style={{ padding: "12px 8px" }}>{deal.assignee}</td>
                <td style={{ padding: "12px 8px" }}><Badge color={STATUS_COLOR[deal.status]}>{deal.status}</Badge></td>
                <td style={{ padding: "12px 8px" }}>
                  <Btn size="sm" variant="secondary" onClick={() => onNavigate("deal_detail", deal.id)}>詳細</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const DealInputScreen = ({ onNavigate }) => (
  <div style={{ padding: 24, maxWidth: 760 }}>
    <PageTitle title="新規商談登録" subtitle="顧客情報と受付内容を登録します" actions={<Btn onClick={() => onNavigate("deal_list")} variant="ghost">一覧へ戻る</Btn>} />
    <Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Input label="顧客名" placeholder="例: 山田太郎" />
        <Input label="担当者" placeholder="例: 佐藤" />
        <Input label="流入経路" type="select" placeholder="選択してください" />
        <Input label="希望日" type="date" />
        <Input label="メールアドレス" placeholder="example@example.com" />
        <Input label="電話番号" placeholder="090-1234-5678" />
      </div>
      <Input label="相談内容" type="textarea" placeholder="相談内容を入力" />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost">下書き保存</Btn>
        <Btn onClick={() => onNavigate("deal_list")}>登録する</Btn>
      </div>
    </Card>
  </div>
);

const DealListScreen = ({ onNavigate, deals }) => (
  <div style={{ padding: 24 }}>
    <PageTitle title="商談一覧" subtitle="全案件の検索・確認" actions={<Btn onClick={() => onNavigate("deal_input")}>新規商談</Btn>} />
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
        <Input label="キーワード" placeholder="顧客名、商談ID" />
        <Input label="担当者" type="select" placeholder="すべて" />
        <Input label="ステータス" type="select" placeholder="すべて" />
        <Input label="受付日" type="date" />
        <Btn variant="secondary">検索</Btn>
      </div>
    </Card>
    <Card>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: C.sub }}>
            <th style={{ padding: "10px 8px" }}>商談ID</th>
            <th style={{ padding: "10px 8px" }}>顧客名</th>
            <th style={{ padding: "10px 8px" }}>担当</th>
            <th style={{ padding: "10px 8px" }}>受付日</th>
            <th style={{ padding: "10px 8px" }}>流入</th>
            <th style={{ padding: "10px 8px" }}>ステータス</th>
            <th style={{ padding: "10px 8px" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} style={{ borderTop: `1px solid ${C.border}` }}>
              <td style={{ padding: "12px 8px" }}>{deal.id}</td>
              <td style={{ padding: "12px 8px" }}>{deal.name}</td>
              <td style={{ padding: "12px 8px" }}>{deal.assignee}</td>
              <td style={{ padding: "12px 8px" }}>{deal.date}</td>
              <td style={{ padding: "12px 8px" }}>{deal.source}</td>
              <td style={{ padding: "12px 8px" }}><Badge color={STATUS_COLOR[deal.status]}>{deal.status}</Badge></td>
              <td style={{ padding: "12px 8px" }}>
                <Btn size="sm" variant="secondary" onClick={() => onNavigate("deal_detail", deal.id)}>詳細</Btn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const DealDetailScreen = ({ onNavigate, role, deal, onStatusChange }) => {
  const [popup, setPopup] = useState(null);
  const nextStatuses = TRANSITIONS[deal.status] || [];

  const handleTransition = (toStatus, screen) => {
    if (screen) {
      onNavigate(screen, deal.id);
      return;
    }
    onStatusChange(deal.id, toStatus);
    setPopup({ title: "ステータスを更新しました", message: `${deal.id} を「${toStatus}」へ更新しました。`, type: "success" });
  };

  const renderActions = () => {
    if (deal.status === STATUS.NEW) {
      return <Btn onClick={() => handleTransition(STATUS.REVIEWING)}>検討中へ進める</Btn>;
    }
    if (deal.status === STATUS.REVIEWING) {
      return (
        <>
          <Btn onClick={() => onNavigate("line_report", deal.id)}>ライン報告へ</Btn>
          <Btn variant="danger" onClick={() => handleTransition(STATUS.LOST)}>失注にする</Btn>
        </>
      );
    }
    if (deal.status === STATUS.REPORTED) {
      return <Btn onClick={() => onNavigate("detail_input", deal.id)}>詳細入力へ</Btn>;
    }
    if (deal.status === STATUS.DETAIL_DONE) {
      return <Btn onClick={() => onNavigate("admin_confirm", deal.id)}>管理確認へ</Btn>;
    }
    if (deal.status === STATUS.CONFIRMED) {
      return role === "管理"
        ? (
          <>
            <Btn onClick={() => onNavigate("payment", deal.id)}>支払処理へ</Btn>
            <Btn variant="secondary" onClick={() => onNavigate("store_assign", deal.id)}>付与店設定へ</Btn>
          </>
        )
        : <Btn disabled>管理ロールで実行</Btn>;
    }
    return <Btn variant="ghost" onClick={() => onNavigate("deal_list")}>一覧へ戻る</Btn>;
  };

  return (
    <div style={{ padding: 24 }}>
      <PageTitle title="商談詳細" subtitle={`${deal.id} の進行状況`} actions={<Btn variant="ghost" onClick={() => onNavigate("deal_list")}>一覧へ戻る</Btn>} />
      <StatusFlowDiagram currentStatus={deal.status} />
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="顧客名" value={deal.name} />
            <Input label="担当者" value={deal.assignee} />
            <Input label="受付日" value={deal.date} />
            <Input label="流入経路" value={deal.source} />
            <Input label="メール" value={deal.email || "未登録"} />
            <Input label="電話番号" value={deal.phone || "未登録"} />
            <Input label="プラン" value={deal.plan || "未設定"} />
            <Input label="付与店" value={deal.store || "未設定"} />
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>進行操作</div>
          <div style={{ marginBottom: 16 }}><Badge color={STATUS_COLOR[deal.status]}>{deal.status}</Badge></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{renderActions()}</div>
          <div style={{ marginTop: 16, fontSize: 12, color: C.sub }}>遷移候補: {nextStatuses.length ? nextStatuses.join(" / ") : "なし"}</div>
        </Card>
      </div>
      {popup && <Popup {...popup} onClose={() => setPopup(null)} />}
    </div>
  );
};

const LineReportScreen = ({ onNavigate, deal, onStatusChange }) => (
  <div style={{ padding: 24, maxWidth: 760 }}>
    <PageTitle title="ライン報告" subtitle={`${deal.id} を上長に報告`} />
    <Card>
      <Input label="報告内容" type="textarea" placeholder="報告メモを入力" />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={() => onNavigate("deal_detail", deal.id)}>戻る</Btn>
        <Btn onClick={() => { onStatusChange(deal.id, STATUS.REPORTED); onNavigate("deal_detail", deal.id); }}>報告完了</Btn>
      </div>
    </Card>
  </div>
);

const DetailInputScreen = ({ onNavigate, deal, onStatusChange, onUpdateDeal }) => (
  <div style={{ padding: 24, maxWidth: 760 }}>
    <PageTitle title="詳細入力" subtitle={`${deal.id} の詳細情報を入力`} />
    <Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Input label="メールアドレス" value={deal.email} placeholder="example@example.com" />
        <Input label="電話番号" value={deal.phone} placeholder="090-1234-5678" />
        <Input label="プラン" value={deal.plan} placeholder="例: スタンダードプラン" />
        <Input label="備考" placeholder="任意" />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={() => onNavigate("deal_detail", deal.id)}>戻る</Btn>
        <Btn onClick={() => { onUpdateDeal(deal.id, { email: deal.email || "sample@example.com", phone: deal.phone || "090-0000-0000", plan: deal.plan || "スタンダードプラン" }); onStatusChange(deal.id, STATUS.DETAIL_DONE); onNavigate("deal_detail", deal.id); }}>保存して完了</Btn>
      </div>
    </Card>
  </div>
);

const AdminConfirmScreen = ({ onNavigate, deal, onStatusChange }) => (
  <div style={{ padding: 24, maxWidth: 760 }}>
    <PageTitle title="管理確認" subtitle={`${deal.id} の承認確認`} />
    <Card>
      <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>申請内容、顧客情報、プラン情報を確認して次工程へ進めます。</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={() => onNavigate("deal_detail", deal.id)}>戻る</Btn>
        <Btn onClick={() => { onStatusChange(deal.id, STATUS.CONFIRMED); onNavigate("deal_detail", deal.id); }}>確認完了</Btn>
      </div>
    </Card>
  </div>
);

const PaymentScreen = ({ onNavigate, deal, onStatusChange }) => (
  <div style={{ padding: 24, maxWidth: 760 }}>
    <PageTitle title="支払処理" subtitle={`${deal.id} の支払処理を実施`} />
    <Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Input label="支払金額" placeholder="100000" />
        <Input label="支払日" type="date" />
        <Input label="支払方法" type="select" placeholder="選択してください" />
        <Input label="処理担当" placeholder="管理担当者名" />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={() => onNavigate("deal_detail", deal.id)}>戻る</Btn>
        <Btn onClick={() => { onStatusChange(deal.id, STATUS.PAYING); onNavigate("deal_detail", deal.id); }}>処理中に更新</Btn>
        <Btn variant="success" onClick={() => { onStatusChange(deal.id, STATUS.WON); onNavigate("deal_detail", deal.id); }}>成約にする</Btn>
      </div>
    </Card>
  </div>
);

const StoreAssignScreen = ({ onNavigate, deal, onStatusChange, onUpdateDeal }) => {
  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <PageTitle title="付与店設定" subtitle={`${deal.id} の付与店を設定`} />
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="付与店" value={deal.store} placeholder="例: 新宿店" />
          <Input label="担当マネージャー" placeholder="例: 店長名" />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => onNavigate("deal_detail", deal.id)}>戻る</Btn>
          <Btn onClick={() => { onUpdateDeal(deal.id, { store: deal.store || "新宿店" }); onStatusChange(deal.id, STATUS.STORE_SET); onNavigate("deal_detail", deal.id); }}>設定完了</Btn>
          <Btn variant="success" onClick={() => { onUpdateDeal(deal.id, { store: deal.store || "新宿店" }); onStatusChange(deal.id, STATUS.WON); onNavigate("deal_detail", deal.id); }}>成約にする</Btn>
        </div>
      </Card>
    </div>
  );
};

const LoginScreen = ({ onNavigate }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)` }}>
    <div style={{ background: C.white, borderRadius: 16, padding: 40, width: 380, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 22, color: C.primary }}>商談管理システム</h1>
      <p style={{ color: C.sub, fontSize: 13, margin: "0 0 28px" }}>ログインして続行してください</p>
      <Btn size="lg" onClick={() => onNavigate("dashboard")}>SSO でログイン</Btn>
      <p style={{ fontSize: 11, color: C.sub, marginTop: 20 }}>シングルサインオン（OAuth 2.0）で認証されます</p>
    </div>
  </div>
);

const INITIAL_DEALS = [
  { id: "D-20260415-003", name: "田中一郎", assignee: "佐藤", date: "2026/04/15", source: "Web", status: STATUS.NEW, email: "", phone: "", plan: "", store: "" },
  { id: "D-20260414-007", name: "鈴木花子", assignee: "山本", date: "2026/04/14", source: "紹介", status: STATUS.REPORTED, email: "", phone: "", plan: "", store: "" },
  { id: "D-20260413-012", name: "高橋太郎", assignee: "佐藤", date: "2026/04/13", source: "電話", status: STATUS.DETAIL_DONE, email: "takahashi@example.com", phone: "080-9876-5432", plan: "プレミアムプラン", store: "" },
  { id: "D-20260412-001", name: "渡辺美咲", assignee: "田中", date: "2026/04/12", source: "Web", status: STATUS.CONFIRMED, email: "watanabe@example.com", phone: "070-1111-2222", plan: "スタンダードプラン", store: "" },
  { id: "D-20260411-005", name: "伊藤健太", assignee: "山本", date: "2026/04/11", source: "紹介", status: STATUS.REVIEWING, email: "", phone: "", plan: "", store: "" },
  { id: "D-20260410-009", name: "中村優子", assignee: "佐藤", date: "2026/04/10", source: "電話", status: STATUS.WON, email: "nakamura@example.com", phone: "090-3333-4444", plan: "スタンダードプラン", store: "新宿店" },
  { id: "D-20260409-002", name: "小林大輔", assignee: "田中", date: "2026/04/09", source: "Web", status: STATUS.LOST, email: "", phone: "", plan: "", store: "" },
];

function App() {
  const [screen, setScreen] = useState("login");
  const [role, setRole] = useState("営業");
  const [deals, setDeals] = useState(INITIAL_DEALS);
  const [selectedDealId, setSelectedDealId] = useState("D-20260415-003");

  const navigate = (s, dealId) => {
    if (dealId) setSelectedDealId(dealId);
    setScreen(s);
  };

  const selectedDeal = deals.find((d) => d.id === selectedDealId) || deals[0];

  const handleStatusChange = (dealId, newStatus) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, status: newStatus } : d)));
  };

  const handleUpdateDeal = (dealId, updates) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, ...updates } : d)));
  };

  const screens = {
    login: <LoginScreen onNavigate={navigate} />,
    dashboard: <DashboardScreen onNavigate={navigate} deals={deals} />,
    deal_input: <DealInputScreen onNavigate={navigate} />,
    deal_list: <DealListScreen onNavigate={navigate} deals={deals} />,
    deal_detail: <DealDetailScreen onNavigate={navigate} role={role} deal={selectedDeal} onStatusChange={handleStatusChange} />,
    line_report: <LineReportScreen onNavigate={navigate} deal={selectedDeal} onStatusChange={handleStatusChange} />,
    detail_input: <DetailInputScreen onNavigate={navigate} deal={selectedDeal} onStatusChange={handleStatusChange} onUpdateDeal={handleUpdateDeal} />,
    admin_confirm: <AdminConfirmScreen onNavigate={navigate} deal={selectedDeal} onStatusChange={handleStatusChange} />,
    payment: <PaymentScreen onNavigate={navigate} deal={selectedDeal} onStatusChange={handleStatusChange} />,
    store_assign: <StoreAssignScreen onNavigate={navigate} deal={selectedDeal} onStatusChange={handleStatusChange} onUpdateDeal={handleUpdateDeal} />,
  };

  if (screen === "login") return screens.login;

  const screenNames = { dashboard: "ダッシュボード", deal_input: "商談入力", deal_list: "商談一覧", deal_detail: "商談詳細", line_report: "ライン報告", detail_input: "詳細入力", admin_confirm: "管理確認", payment: "支払管理", store_assign: "付与店設定" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
      <Header currentScreen={screen} onNavigate={navigate} role={role} />
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "6px 24px", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
        <span style={{ color: C.sub, fontWeight: 600 }}>ロール切替:</span>
        {["営業", "事務", "管理"].map((r) => (
          <button key={r} onClick={() => setRole(r)} style={{ padding: "3px 12px", borderRadius: 14, border: `1px solid ${role === r ? C.accent : C.border}`, background: role === r ? C.accent : C.white, color: role === r ? C.white : C.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {r}
          </button>
        ))}
        <span style={{ marginLeft: "auto", color: C.sub }}>
          現在の画面: <strong style={{ color: C.text }}>{screenNames[screen] || screen}</strong>
        </span>
      </div>
      {screens[screen]}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
