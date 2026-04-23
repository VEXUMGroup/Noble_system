import { useState } from "react";

// ===== 色定義 =====
const COLORS = {
  primary: "#2E75B6",
  primaryLight: "#4A90D9",
  success: "#27AE60",
  warning: "#E67E22",
  danger: "#E74C3C",
  purple: "#8E44AD",
  gray: "#95A5A6",
  grayLight: "#ECF0F1",
  grayDark: "#7F8C8D",
  white: "#FFFFFF",
  bg: "#F8F9FA",
  border: "#DEE2E6",
  text: "#2C3E50",
  textLight: "#6C757D",
};

// ===== 共通コンポーネント =====
const Badge = ({ color, children }) => (
  <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, color: "#fff", backgroundColor: color }}>{children}</span>
);

const StatusBadge = ({ status }) => {
  const map = { "成約": COLORS.primary, "検討中": COLORS.warning, "対象外": COLORS.gray, "失注": COLORS.grayDark, "新規": COLORS.success, "面談済": COLORS.primaryLight, "詳細入力済": "#3498DB", "事務承認済": COLORS.warning, "締結済": COLORS.purple, "支払管理中": COLORS.danger, "完了": COLORS.success };
  return <Badge color={map[status] || COLORS.gray}>{status}</Badge>;
};

const Button = ({ children, color = COLORS.primary, outline, small, onClick, disabled, style: s }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: small ? "4px 12px" : "8px 20px", border: outline ? "1px solid " + color : "none", borderRadius: 6, backgroundColor: outline ? "transparent" : color, color: outline ? color : "#fff", fontSize: small ? 12 : 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...s }}>{children}</button>
);

const Input = ({ label, required, type = "text", placeholder, value, width, disabled }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{label}{required && <span style={{ color: COLORS.danger }}> *</span>}</label>
    <input disabled={disabled} type={type} placeholder={placeholder} defaultValue={value} style={{ width: width || "100%", padding: "7px 10px", border: "1px solid " + COLORS.border, borderRadius: 4, fontSize: 13, backgroundColor: disabled ? COLORS.grayLight : "#fff", boxSizing: "border-box" }} />
  </div>
);

const Select = ({ label, required, options, disabled, value }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{label}{required && <span style={{ color: COLORS.danger }}> *</span>}</label>
    <select disabled={disabled} defaultValue={value} style={{ width: "100%", padding: "7px 10px", border: "1px solid " + COLORS.border, borderRadius: 4, fontSize: 13, backgroundColor: disabled ? COLORS.grayLight : "#fff" }}>
      {options.map((o, i) => <option key={i}>{o}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, placeholder, rows = 3, disabled, value }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{label}</label>}
    <textarea disabled={disabled} placeholder={placeholder} rows={rows} defaultValue={value} style={{ width: "100%", padding: "7px 10px", border: "1px solid " + COLORS.border, borderRadius: 4, fontSize: 13, resize: "vertical", boxSizing: "border-box", backgroundColor: disabled ? COLORS.grayLight : "#fff" }} />
  </div>
);

const Card = ({ title, children, style: s }) => (
  <div style={{ backgroundColor: "#fff", border: "1px solid " + COLORS.border, borderRadius: 8, padding: 16, marginBottom: 16, ...s }}>
    {title && <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid " + COLORS.grayLight }}>{title}</div>}
    {children}
  </div>
);

const ScreenHeader = ({ title, subtitle, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottom: "2px solid " + COLORS.primary }}>
    <div>
      <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>{title}</h2>
      {subtitle && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>{subtitle}</div>}
    </div>
    <div style={{ display: "flex", gap: 8 }}>{right}</div>
  </div>
);

const TableHeader = ({ columns }) => (
  <tr>{columns.map((c, i) => <th key={i} style={{ padding: "8px 10px", backgroundColor: COLORS.primary, color: "#fff", fontSize: 11, fontWeight: 600, textAlign: "left", whiteSpace: "nowrap" }}>{c}</th>)}</tr>
);

// ===== 1. ログイン画面 =====
const LoginScreen = ({ onNavigate }) => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 500, backgroundColor: COLORS.bg }}>
    <div style={{ width: 380, backgroundColor: "#fff", borderRadius: 12, padding: 40, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", backgroundColor: COLORS.primary, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 700 }}>商</div>
      <h1 style={{ fontSize: 22, color: COLORS.text, margin: "0 0 4px" }}>商談管理システム</h1>
      <p style={{ fontSize: 12, color: COLORS.textLight, margin: "0 0 32px" }}>社会保険給付金サポート業務</p>
      <div style={{ padding: 16, backgroundColor: COLORS.grayLight, borderRadius: 8, marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: COLORS.textLight, margin: "0 0 8px" }}>SSO認証（OAuth 2.0 / OpenID Connect）</p>
        <p style={{ fontSize: 11, color: COLORS.grayDark, margin: 0 }}>対象: 全ロール（営業・事務・管理）</p>
      </div>
      <Button onClick={() => onNavigate("dashboard")} style={{ width: "100%", padding: "12px 0", fontSize: 15 }}>SSOでログイン</Button>
      <p style={{ fontSize: 10, color: COLORS.grayDark, marginTop: 16, marginBottom: 0 }}>トークン有効期限: アクセス1時間 / リフレッシュ7日間</p>
    </div>
  </div>
);

// ===== 2. ダッシュボード =====
const DashboardScreen = ({ onNavigate }) => {
  const [showPopup, setShowPopup] = useState(true);
  return (
    <div>
      <ScreenHeader title="ダッシュボード" subtitle="案件サマリー・通知一覧・直近タスク｜対象: 全ロール" right={<>
        <Button onClick={() => onNavigate("deal_input")}>新規商談</Button>
        <Button onClick={() => onNavigate("deal_list")} outline>商談一覧</Button>
        <Button onClick={() => onNavigate("master")} color={COLORS.purple} outline>マスタ管理</Button>
      </>} />
      {showPopup && (
        <div style={{ position: "relative", backgroundColor: "#FFF3CD", border: "1px solid #FFEAA7", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#856404", marginBottom: 6 }}>退職日14日前アラート <Badge color={COLORS.danger}>2件</Badge></div>
            <div style={{ fontSize: 12, color: "#856404", marginBottom: 4 }}>山田太郎 様の退職予定日が14日後（2026/04/30）です。成約確認を行いましょう。</div>
            <div style={{ fontSize: 12, color: "#856404", marginBottom: 8 }}>佐藤花子 様の退職予定日が14日後（2026/04/30）です。成約確認を行いましょう。</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button small onClick={() => onNavigate("deal_detail")} color="#856404">商談詳細を確認</Button>
              <Button small outline onClick={() => setShowPopup(false)} color="#856404">後で確認</Button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[{ label: "新規", count: 8, color: COLORS.success }, { label: "検討中", count: 12, color: COLORS.warning }, { label: "成約", count: 25, color: COLORS.primary }, { label: "締結済", count: 18, color: COLORS.purple }].map((s, i) => (
          <Card key={i} style={{ textAlign: "center", marginBottom: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: COLORS.textLight }}>{s.label}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="通知一覧">
          {[{ text: "承認依頼: 鈴木一郎様の成約情報を確認してください", time: "10:30" },
            { text: "支払期日3日前: 田中次郎様（2026/04/19）", time: "09:00" },
            { text: "未入金: 高橋三郎様の入金確認をしてください", time: "昨日" },
            { text: "代理店コミッション発生: AG001（支払総額50%到達）", time: "昨日" }
          ].map((n, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: i < 3 ? "1px solid " + COLORS.grayLight : "none", display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div style={{ fontSize: 12, color: COLORS.text, flex: 1 }}>{n.text}</div>
              <div style={{ fontSize: 10, color: COLORS.grayDark, whiteSpace: "nowrap", marginLeft: 8 }}>{n.time}</div>
            </div>
          ))}
        </Card>
        <Card title="直近のタスク">
          {[{ task: "山田太郎様 - 成約詳細入力", status: "成約", due: "今日" },
            { task: "佐藤花子様 - 退職日後追い", status: "検討中", due: "明日" },
            { task: "鈴木一郎様 - 事務承認待ち", status: "詳細入力済", due: "04/18" },
            { task: "田中次郎様 - 締結手続き", status: "事務承認済", due: "04/20" }
          ].map((t, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: i < 3 ? "1px solid " + COLORS.grayLight : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: COLORS.text }}>{t.task}</div>
                <StatusBadge status={t.status} />
              </div>
              <div style={{ fontSize: 11, color: COLORS.grayDark }}>{t.due}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ===== 3. 商談入力画面（仕様書 5.2） =====
const DealInputScreen = ({ onNavigate }) => (
  <div>
    <ScreenHeader title="新規商談登録" subtitle="新規案件の基本情報入力フォーム｜対象: 営業" right={<>
      <Button onClick={() => onNavigate("deal_detail")}>保存</Button>
      <Button outline onClick={() => onNavigate("dashboard")} color={COLORS.grayDark}>キャンセル</Button>
    </>} />
    <Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, marginBottom: 12 }}>左カラム</div>
          <Input label="お客様氏名" required placeholder="例: 山田太郎" />
          <Select label="担当" required options={["-- 選択してください --", "営業A", "営業B", "営業C"]} />
          <Input label="商談日" required type="date" />
          <Select label="流入経路（エルステ経由）" required options={["-- 選択してください --", "WEBシーズ_Meta", "Googleリスティング", "TikTok", "直LINE", "その他"]} />
          <Input label="退職予定日" required type="date" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, marginBottom: 12 }}>右カラム</div>
          <Select label="面談ステータス" required options={["面談実施", "面談【飛び】", "面談【キャンセル】", "再面談予定"]} />
          <Select label="結果ステータス" options={["-- 未選択 --", "成約", "検討中", "失注", "対象外"]} />
          <Select label="見込み顧客" options={["-- 未選択 --", "見込みあり", "見込み低", "新規", "再商談"]} />
          <Input label="紹介者（代理店経由）" placeholder="例: 代理店A" />
          <Select label="代理店新旧" options={["-- 未選択 --", "新規", "既存"]} />
        </div>
      </div>
    </Card>
    <Card>
      <TextArea label="商談内容（メモ）" placeholder="商談で話した内容や次回対応内容のメモ" rows={4} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 24px" }}>
        <Input label="次回アクション日" type="date" />
        <Input label="レコ（動画）URL" placeholder="https://..." />
        <Select label="人材提案" options={["-- 未選択 --", "対象", "対象外"]} />
      </div>
      <TextArea label="備考欄" placeholder="その他補足事項" rows={2} />
    </Card>
    <div style={{ fontSize: 11, color: COLORS.textLight }}>※ IDは自動採番のため画面に表示しません。登録後に採番結果を表示します。</div>
  </div>
);

// ===== 4. 商談一覧画面（仕様書 5.6） =====
const DealListScreen = ({ onNavigate }) => (
  <div>
    <ScreenHeader title="商談一覧" subtitle="登録済み案件の検索・一覧表示｜対象: 全ロール" right={<Button onClick={() => onNavigate("deal_input")}>新規商談</Button>} />
    <Card>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
        <div style={{ flex: 1, minWidth: 120 }}><Select label="ステータス" options={["全て", "新規", "面談済", "成約", "検討中", "対象外", "失注"]} /></div>
        <div style={{ flex: 1, minWidth: 120 }}><Select label="担当者" options={["全て", "営業A", "営業B", "営業C"]} /></div>
        <div style={{ flex: 1, minWidth: 120 }}><Input label="商談日（開始）" type="date" /></div>
        <div style={{ flex: 1, minWidth: 120 }}><Input label="商談日（終了）" type="date" /></div>
        <div style={{ flex: 1, minWidth: 120 }}><Select label="代理店" options={["全て", "代理店A", "代理店B"]} /></div>
        <div style={{ flex: 1, minWidth: 120 }}><Select label="流入経路" options={["全て", "WEBシーズ_Meta", "Googleリスティング", "TikTok", "直LINE"]} /></div>
        <div><Button small>検索</Button></div>
      </div>
    </Card>
    <Card>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><TableHeader columns={["ID", "お客様氏名", "担当", "商談日", "退職予定日", "ステータス", "流入経路", "代理店"]} /></thead>
          <tbody>
            {[
              { id: "D-20260401-001", name: "山田太郎", staff: "営業A", date: "2026/04/01", retire: "2026/04/30", status: "検討中", source: "Meta", agency: "代理店A", urgent: true },
              { id: "D-20260402-002", name: "佐藤花子", staff: "営業B", date: "2026/04/02", retire: "2026/05/01", status: "検討中", source: "TikTok", agency: "-", urgent: true },
              { id: "D-20260403-003", name: "鈴木一郎", staff: "営業A", date: "2026/04/03", retire: "2026/07/15", status: "成約", source: "Google", agency: "-", urgent: false },
              { id: "D-20260404-004", name: "田中次郎", staff: "営業C", date: "2026/04/04", retire: "2026/08/01", status: "事務承認済", source: "直LINE", agency: "代理店B", urgent: false },
              { id: "D-20260405-005", name: "高橋三郎", staff: "営業B", date: "2026/04/05", retire: "2026/06/15", status: "対象外", source: "Meta", agency: "-", urgent: false },
            ].map((r, i) => (
              <tr key={i} onClick={() => onNavigate("deal_detail")} style={{ cursor: "pointer", backgroundColor: r.urgent ? "#FDEDEC" : (i % 2 === 0 ? "#fff" : COLORS.grayLight) }}>
                {[r.id, r.name, r.staff, r.date, r.retire].map((v, j) => <td key={j} style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{v}</td>)}
                <td style={{ padding: "8px 10px", borderBottom: "1px solid " + COLORS.border }}><StatusBadge status={r.status} /></td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{r.source}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{r.agency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 4 }}>※ 退職予定日が14日以内の検討案件は赤ハイライト表示</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 12 }}>
        {["<", "1", "2", "3", "...", "10", ">"].map((p, i) => (
          <span key={i} style={{ padding: "4px 10px", border: "1px solid " + COLORS.border, borderRadius: 4, fontSize: 12, cursor: "pointer", backgroundColor: p === "1" ? COLORS.primary : "#fff", color: p === "1" ? "#fff" : COLORS.text }}>{p}</span>
        ))}
        <span style={{ fontSize: 11, color: COLORS.textLight, alignSelf: "center", marginLeft: 8 }}>20件/ページ</span>
      </div>
    </Card>
  </div>
);

// ===== 5. 商談詳細画面（仕様書 5.7） =====
const DealDetailScreen = ({ onNavigate }) => (
  <div>
    <ScreenHeader title={<span>D-20260401-001 山田太郎 様 <StatusBadge status="面談済" /></span>} subtitle="案件の詳細情報表示・編集｜対象: 全ロール（操作はロール別）" right={<Button small outline onClick={() => onNavigate("deal_list")} color={COLORS.grayDark}>一覧に戻る</Button>} />
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
      <div>
        <Card title="基本情報（営業は編集可）">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <Input label="お客様氏名" required value="山田太郎" />
            <Select label="担当" required options={["営業A", "営業B", "営業C"]} value="営業A" />
            <Input label="商談日" required type="date" value="2026-04-01" />
            <Select label="流入経路" required options={["WEBシーズ_Meta", "Googleリスティング", "TikTok", "直LINE"]} />
            <Input label="退職予定日" required type="date" value="2026-04-30" />
            <Input label="紹介者（代理店経由）" value="代理店A" />
          </div>
          <TextArea label="メモ" value="初回面談実施済み。給付金対象の可能性あり。退職予定日が近いため早めのフォロー必要。" />
        </Card>
        <Card title="ステータス変更履歴・担当メモ（時系列）">
          {[
            { date: "2026/04/01 10:00", user: "システム", action: "新規 → 新規登録（Googleカレンダー自動取得）" },
            { date: "2026/04/01 14:30", user: "営業A", action: "新規 → 面談済（面談実施）" },
            { date: "2026/04/01 14:35", user: "営業A", action: "メモ追記: 給付金対象の可能性あり" },
          ].map((h, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid " + COLORS.grayLight, fontSize: 12 }}>
              <span style={{ color: COLORS.textLight, whiteSpace: "nowrap", minWidth: 120 }}>{h.date}</span>
              <span style={{ color: COLORS.primary, fontWeight: 600, minWidth: 60 }}>{h.user}</span>
              <span style={{ color: COLORS.text }}>{h.action}</span>
            </div>
          ))}
        </Card>
      </div>
      <div>
        <Card title="ステータス操作">
          <div style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 12 }}>現在のステータスに応じたアクションボタンを動的表示</div>
          <div style={{ padding: 12, backgroundColor: "#EBF5FB", borderRadius: 6, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.primary, marginBottom: 8 }}>面談済の場合</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Button onClick={() => onNavigate("deal_detail_input")} color={COLORS.primary}>成約</Button>
              <Button onClick={() => onNavigate("review_mgmt")} color={COLORS.warning}>検討</Button>
              <Button color={COLORS.gray}>対象外</Button>
            </div>
          </div>
          <div style={{ padding: 12, backgroundColor: COLORS.grayLight, borderRadius: 6, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 8 }}>成約の場合</div>
            <Button onClick={() => onNavigate("deal_detail_input")} color={COLORS.primaryLight} style={{ width: "100%" }}>詳細入力へ進む</Button>
          </div>
          <div style={{ padding: 12, backgroundColor: COLORS.grayLight, borderRadius: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textLight, marginBottom: 8 }}>検討の場合</div>
            <Button onClick={() => onNavigate("review_mgmt")} color={COLORS.warning} style={{ width: "100%" }}>検討管理へ</Button>
          </div>
        </Card>
        <Card title="案件情報">
          <div style={{ fontSize: 12 }}>
            {[["面談ステータス", "面談実施"], ["結果ステータス", "（未選択）"], ["契約書締結確認", "未送付"], ["見込み顧客", "見込みあり"], ["代理店新旧", "新規"]].map(([k, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid " + COLORS.grayLight }}>
                <span style={{ color: COLORS.textLight }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
);

// ===== 6. 検討管理画面（仕様書 5.8） =====
const ReviewMgmtScreen = ({ onNavigate }) => (
  <div>
    <ScreenHeader title={<span>検討中案件管理 <Badge color={COLORS.warning}>12件</Badge></span>} subtitle="検討中案件の管理・退職日リマインド表示｜対象: 営業" />
    <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 12 }}>
      <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, backgroundColor: COLORS.danger, verticalAlign: "middle", marginRight: 4 }} /> 赤: 14日以内（ポップアップ通知対象）</span>
      <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, backgroundColor: COLORS.warning, verticalAlign: "middle", marginRight: 4 }} /> 橙: 15〜30日以内</span>
      <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, backgroundColor: COLORS.success, verticalAlign: "middle", marginRight: 4 }} /> 緑: 31日以上</span>
    </div>
    <Card>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><TableHeader columns={["お客様氏名", "担当", "退職予定日", "残り日数", "次回アクション日", "メモ", "操作"]} /></thead>
          <tbody>
            {[
              { name: "山田太郎", staff: "営業A", retire: "2026/04/30", days: 14, next: "2026/04/18", memo: "給付金対象見込み。再連絡予定", color: COLORS.danger },
              { name: "佐藤花子", staff: "営業B", retire: "2026/05/01", days: 15, next: "2026/04/20", memo: "検討中。家族と相談とのこと", color: COLORS.warning },
              { name: "中村太一", staff: "営業A", retire: "2026/05/10", days: 24, next: "2026/04/25", memo: "前向き検討中", color: COLORS.warning },
              { name: "伊藤美咲", staff: "営業C", retire: "2026/06/15", days: 60, next: "2026/05/01", memo: "退職時期未確定", color: COLORS.success },
            ].map((r, i) => (
              <tr key={i} onClick={() => onNavigate("deal_detail")} style={{ cursor: "pointer", backgroundColor: r.days <= 14 ? "#FDEDEC" : (i % 2 === 0 ? "#fff" : COLORS.grayLight) }}>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border, fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{r.staff}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{r.retire}</td>
                <td style={{ padding: "8px 10px", borderBottom: "1px solid " + COLORS.border }}>
                  <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: "#fff", backgroundColor: r.color }}>{r.days}日</span>
                </td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{r.next}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border, maxWidth: 200 }}>{r.memo}</td>
                <td style={{ padding: "8px 10px", borderBottom: "1px solid " + COLORS.border }}><Button small onClick={() => onNavigate("deal_detail")}>詳細</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    <Card title="ポップアップ通知仕様" style={{ backgroundColor: "#FFF9E6" }}>
      <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.8 }}>
        <div><strong>発動条件:</strong> 利用者の退職予定日の14日前になった時点（当日0時に判定）</div>
        <div><strong>表示タイミング:</strong> ログイン時・ダッシュボードアクセス時に自動表示</div>
        <div><strong>表示内容:</strong> 「[顧客名]様の退職予定日が14日後（YYYY/MM/DD）です。成約確認を行いましょう。」</div>
        <div><strong>アクション:</strong> 「商談詳細を確認」→ 商談詳細画面 / 「後で確認」→ ポップアップを閉じる</div>
        <div><strong>複数件:</strong> 件数バッジを表示し、リスト形式で全件を一覧表示</div>
      </div>
    </Card>
  </div>
);

// ===== 7. 成約詳細入力画面（仕様書 5.3） =====
const DealDetailInputScreen = ({ onNavigate }) => (
  <div>
    <ScreenHeader title="成約詳細入力" subtitle="プラン・金額・支払方法・期限の入力｜対象: 営業" right={<Button small outline onClick={() => onNavigate("deal_detail")} color={COLORS.grayDark}>商談詳細に戻る</Button>} />
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
      <div>
        <Card title="成約詳細情報を入力してください">
          <Select label="成約プラン" required options={["-- プランを選択 --", "10ヶ月プラン", "28ヶ月プラン", "カスタムプラン"]} />
          <Input label="金額（円）" required type="text" placeholder="例: 350,000" />
          <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: -8, marginBottom: 12 }}>※ カンマ区切り自動挿入</div>
          <Select label="支払方法" required options={["-- 選択してください --", "Stripe決済", "振り込み"]} />
          <Input label="支払期限" required type="date" />
          <Input label="提案内容" placeholder="顧客へ提案したサービス・プラン内容" />
          <Select label="支払いプラン" options={["一括", "3回払い", "4回払い"]} />
        </Card>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => onNavigate("approval")} color={COLORS.success} style={{ padding: "12px 40px", fontSize: 15 }}>確定（事務へ承認依頼通知を送信）</Button>
          <Button outline onClick={() => onNavigate("deal_detail")} color={COLORS.grayDark}>キャンセル</Button>
        </div>
      </div>
      <Card title="案件サマリー" style={{ height: "fit-content" }}>
        <div style={{ fontSize: 12, lineHeight: 2 }}>
          {[["案件ID", "D-20260401-001"], ["顧客氏名", "山田太郎"], ["担当", "営業A"], ["商談日", "2026/04/01"], ["退職予定日", "2026/04/30"], ["流入経路", "WEBシーズ_Meta"], ["代理店", "代理店A"]].map(([k, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid " + COLORS.grayLight }}>
              <span style={{ color: COLORS.textLight }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

// ===== 8. 事務承認画面（仕様書 5.4） =====
const ApprovalScreen = ({ onNavigate }) => (
  <div>
    <ScreenHeader title={<span>事務承認 <StatusBadge status="詳細入力済" /></span>} subtitle="成約情報の確認・承認・差し戻し｜対象: 事務" />
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
      <div>
        <Card title="案件情報（読み取り専用）">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <Input label="案件ID" value="D-20260401-001" disabled />
            <Input label="お客様氏名" value="山田太郎" disabled />
            <Input label="担当" value="営業A" disabled />
            <Input label="商談日" value="2026/04/01" disabled />
            <Input label="退職予定日" value="2026/04/30" disabled />
            <Input label="流入経路" value="WEBシーズ_Meta" disabled />
            <Input label="代理店" value="代理店A" disabled />
            <Input label="代理店新旧" value="新規" disabled />
          </div>
        </Card>
        <Card title="成約詳細情報（読み取り専用）">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <Input label="成約プラン" value="28ヶ月プラン" disabled />
            <Input label="金額" value="350,000円" disabled />
            <Input label="支払方法" value="Stripe決済" disabled />
            <Input label="支払期限" value="2026/05/15" disabled />
            <Input label="支払いプラン" value="3回払い" disabled />
            <Input label="提案内容" value="雇用保険＋傷病手当金サポート" disabled />
          </div>
        </Card>
        <Card title="商談メモ（読み取り専用）">
          <TextArea value="初回面談実施済み。給付金対象の可能性あり。退職予定日が近いため早めのフォロー必要。本人の意思確認済み。" disabled rows={3} />
        </Card>
      </div>
      <div>
        <Card title="承認操作">
          <Button onClick={() => onNavigate("contract")} color={COLORS.success} style={{ width: "100%", padding: "12px 0", fontSize: 14, marginBottom: 12 }}>承認（ステータスを「事務承認済」に更新）</Button>
          <div style={{ borderTop: "1px solid " + COLORS.border, paddingTop: 12 }}>
            <TextArea label="差し戻しコメント" placeholder="差し戻し理由を入力してください" rows={3} />
            <Button onClick={() => onNavigate("deal_detail_input")} color={COLORS.danger} outline style={{ width: "100%" }}>差し戻し（前工程へ）</Button>
          </div>
        </Card>
        <Card title="チェックリスト" style={{ backgroundColor: "#FAFAFA" }}>
          <div style={{ fontSize: 12, lineHeight: 2 }}>
            {["プランが正しく選択されているか", "金額に誤りがないか", "支払方法が適切か", "支払期限が妥当か", "顧客情報に不備がないか"].map((c, i) => (
              <div key={i}><input type="checkbox" style={{ marginRight: 6 }} />{c}</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
);

// ===== 9. 締結画面（仕様書 5.5） =====
const ContractScreen = ({ onNavigate }) => (
  <div>
    <ScreenHeader title={<span>締結手続き <StatusBadge status="事務承認済" /></span>} subtitle="住所・締結日の入力、契約書締結｜対象: 営業・事務" />
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
      <div>
        <Card title="案件情報">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px", fontSize: 12 }}>
            {[["案件ID", "D-20260401-001"], ["顧客氏名", "山田太郎"], ["成約プラン", "28ヶ月プラン"], ["金額", "350,000円"], ["支払方法", "Stripe決済"], ["支払期限", "2026/05/15"]].map(([k, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + COLORS.grayLight }}>
                <span style={{ color: COLORS.textLight }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="締結情報を入力してください">
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary, marginBottom: 8 }}>住所</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0 16px" }}>
            <Input label="郵便番号" required placeholder="例: 100-0001" />
            <Input label="都道府県" required placeholder="例: 東京都" />
          </div>
          <Input label="市区町村" required placeholder="例: 千代田区丸の内" />
          <Input label="番地・建物名" required placeholder="例: 1-1-1 丸の内ビル301" />
          <Input label="締結日" required type="date" />
          <Select label="契約書締結確認" required options={["未送付", "送付済", "回収待ち", "完了"]} />
        </Card>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => onNavigate("payment")} color={COLORS.purple} style={{ padding: "12px 40px", fontSize: 15 }}>締結完了（ステータスを「締結済」に更新）</Button>
          <Button outline color={COLORS.grayDark}>キャンセル</Button>
        </div>
      </div>
      <Card title="ステータス遷移" style={{ height: "fit-content" }}>
        <div style={{ fontSize: 12, lineHeight: 2.2 }}>
          {["新規", "面談済", "成約", "詳細入力済", "事務承認済 ← 現在", "締結済 ← 次", "支払管理中", "完了"].map((s, i) => (
            <div key={i} style={{ color: s.includes("現在") ? COLORS.primary : s.includes("次") ? COLORS.purple : COLORS.textLight, fontWeight: s.includes("現在") || s.includes("次") ? 700 : 400 }}>
              {i > 0 && <span style={{ color: COLORS.border }}> ↓</span>} {s}
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

// ===== 10. 支払管理画面（仕様書 4.5, 4.6） =====
const PaymentScreen = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const customers = [
    { name: "山田太郎", amount: "350,000", amountNum: 350000, method: "Stripe", plan: "3回払い", planCount: 3, paid: "116,667", paidNum: 116667, unpaid: "233,333", status: "一部入金", due: "2026/05/15", agency: "代理店A", sc: COLORS.warning, paidCount: 1,
      history: [{ date: "2026/04/15", amount: "116,667", method: "Stripe自動", memo: "1回目/3回 自動決済完了" }] },
    { name: "鈴木一郎", amount: "280,000", amountNum: 280000, method: "振り込み", plan: "一括", planCount: 1, paid: "0", paidNum: 0, unpaid: "280,000", status: "未入金", due: "2026/04/20", agency: "-", sc: COLORS.danger, paidCount: 0, history: [] },
    { name: "田中次郎", amount: "450,000", amountNum: 450000, method: "Stripe", plan: "4回払い", planCount: 4, paid: "225,000", paidNum: 225000, unpaid: "225,000", status: "一部入金", due: "2026/05/01", agency: "代理店B", sc: COLORS.warning, paidCount: 2,
      history: [{ date: "2026/03/01", amount: "112,500", method: "Stripe自動", memo: "1回目/4回" }, { date: "2026/04/01", amount: "112,500", method: "Stripe自動", memo: "2回目/4回" }] },
    { name: "渡辺健太", amount: "350,000", amountNum: 350000, method: "Stripe", plan: "一括", planCount: 1, paid: "350,000", paidNum: 350000, unpaid: "0", status: "全額入金完了", due: "-", agency: "-", sc: COLORS.success, paidCount: 1,
      history: [{ date: "2026/03/20", amount: "350,000", method: "Stripe自動", memo: "一括決済完了" }] },
  ];
  return (
  <div>
    <ScreenHeader title="支払管理" subtitle="支払処理の実行・状況管理・代理店コミッション｜対象: 管理" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
      {[{ label: "未入金", count: 5, color: COLORS.danger }, { label: "一部入金", count: 3, color: COLORS.warning }, { label: "全額入金完了", count: 15, color: COLORS.success }, { label: "過剰入金", count: 1, color: COLORS.purple }].map((s, i) => (
        <Card key={i} style={{ textAlign: "center", marginBottom: 0, borderLeft: "4px solid " + s.color }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
          <div style={{ fontSize: 12, color: COLORS.textLight }}>{s.label}</div>
        </Card>
      ))}
    </div>
    <Card title="支払い一覧">
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><TableHeader columns={["顧客氏名", "成約金額", "支払方法", "支払プラン", "入金済", "未払い", "支払ステータス", "入金期日", "代理店", "操作"]} /></thead>
          <tbody>
            {customers.map((r, i) => (
              <tr key={i} style={{ backgroundColor: r.status === "未入金" ? "#FDEDEC" : (i % 2 === 0 ? "#fff" : COLORS.grayLight) }}>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border, fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border, textAlign: "right" }}>{r.amount}円</td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{r.method}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{r.plan}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border, textAlign: "right" }}>{r.paid}円</td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border, textAlign: "right", color: r.unpaid !== "0" ? COLORS.danger : COLORS.success, fontWeight: 600 }}>{r.unpaid}円</td>
                <td style={{ padding: "8px 10px", borderBottom: "1px solid " + COLORS.border }}><Badge color={r.sc}>{r.status}</Badge></td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{r.due}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{r.agency}</td>
                <td style={{ padding: "8px 10px", borderBottom: "1px solid " + COLORS.border, whiteSpace: "nowrap" }}>
                  <Button small onClick={() => setSelectedCustomer(r)} color={r.status === "全額入金完了" ? COLORS.grayDark : COLORS.primary}>
                    {r.status === "全額入金完了" ? "履歴" : "入金入力"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    {/* 入金入力モーダル */}
    {selectedCustomer && (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
        <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, width: 640, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid " + COLORS.primary }}>
            <h3 style={{ margin: 0, fontSize: 18, color: COLORS.text }}>入金管理 - {selectedCustomer.name} 様</h3>
            <button onClick={() => setSelectedCustomer(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.grayDark, padding: "0 4px" }}>✕</button>
          </div>

          {/* 顧客支払サマリー */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 12, backgroundColor: COLORS.grayLight, borderRadius: 6, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: COLORS.textLight }}>成約金額</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{selectedCustomer.amount}円</div>
            </div>
            <div style={{ padding: 12, backgroundColor: "#E8F8F0", borderRadius: 6, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: COLORS.textLight }}>入金済</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.success }}>{selectedCustomer.paid}円</div>
            </div>
            <div style={{ padding: 12, backgroundColor: selectedCustomer.paidNum < selectedCustomer.amountNum ? "#FDEDEC" : "#E8F8F0", borderRadius: 6, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: COLORS.textLight }}>未払い残高</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: selectedCustomer.paidNum < selectedCustomer.amountNum ? COLORS.danger : COLORS.success }}>{selectedCustomer.unpaid}円</div>
            </div>
          </div>

          {/* 支払い詳細情報 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginBottom: 16, fontSize: 12 }}>
            {[["支払方法", selectedCustomer.method], ["支払プラン", selectedCustomer.plan], ["支払済回数", selectedCustomer.paidCount + "/" + selectedCustomer.planCount + "回"], ["次回入金期日", selectedCustomer.due], ["代理店", selectedCustomer.agency], ["支払ステータス", selectedCustomer.status]].map(([k, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + COLORS.grayLight }}>
                <span style={{ color: COLORS.textLight }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* 入金履歴 */}
          {selectedCustomer.history.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>入金履歴</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><TableHeader columns={["入金日", "入金額", "入金方法", "メモ"]} /></thead>
                <tbody>
                  {selectedCustomer.history.map((h, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : COLORS.grayLight }}>
                      <td style={{ padding: "6px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{h.date}</td>
                      <td style={{ padding: "6px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border, textAlign: "right", fontWeight: 600 }}>{h.amount}円</td>
                      <td style={{ padding: "6px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{h.method}</td>
                      <td style={{ padding: "6px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{h.memo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 入金入力フォーム（未完了の場合のみ表示） */}
          {selectedCustomer.status !== "全額入金完了" && (
            <div style={{ padding: 16, backgroundColor: "#F0F7FF", borderRadius: 8, border: "1px solid " + COLORS.primaryLight }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginBottom: 12 }}>新規入金を登録</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <Input label="入金日" required type="date" />
                <Input label="入金額（円）" required placeholder={"例: " + (selectedCustomer.amountNum / selectedCustomer.planCount).toLocaleString()} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <Select label="入金方法" required options={selectedCustomer.method === "Stripe" ? ["Stripe自動決済", "Stripe手動決済", "振り込み（例外対応）"] : ["振り込み確認", "Stripe（例外対応）"]} />
                <Select label="支払ステータス更新" required options={["入金完了（今回分）", "全額入金完了", "一部入金", "過剰入金"]} />
              </div>
              <Input label="支払い名義" placeholder="顧客名と異なる場合に入力（全角カナ推奨）" />
              <TextArea label="メモ" placeholder="例: 2回目/3回 振り込み確認済み" rows={2} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <Button color={COLORS.success} style={{ flex: 1 }}>入金を登録</Button>
                <Button outline color={COLORS.grayDark} onClick={() => setSelectedCustomer(null)}>キャンセル</Button>
              </div>
            </div>
          )}

          {selectedCustomer.status === "全額入金完了" && (
            <div style={{ padding: 12, backgroundColor: "#E8F8F0", borderRadius: 8, textAlign: "center", fontSize: 13, color: COLORS.success, fontWeight: 600 }}>
              全額入金完了済み
            </div>
          )}
        </div>
      </div>
    )}

    <Card title="代理店コミッション管理">
      <div style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 12 }}>コミッション自動計算: 利用者の支払総額の50%到達時に、その25%を代理店への支払額として自動計算</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><TableHeader columns={["代理店", "対象顧客", "成約金額", "入金済", "進捗率", "トリガー(50%)", "コミッション(25%)", "ステータス"]} /></thead>
        <tbody>
          {[
            { agency: "代理店A", customer: "山田太郎", amount: "350,000", paid: "116,667", pct: "33%", trigger: "175,000", commission: "43,750", status: "未発生", color: COLORS.gray },
            { agency: "代理店B", customer: "田中次郎", amount: "450,000", paid: "225,000", pct: "50%", trigger: "225,000", commission: "56,250", status: "発生済", color: COLORS.warning },
          ].map((r, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : COLORS.grayLight }}>
              {[r.agency, r.customer, r.amount + "円", r.paid + "円", r.pct, r.trigger + "円", r.commission + "円"].map((v, j) => (
                <td key={j} style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{v}</td>
              ))}
              <td style={{ padding: "8px 10px", borderBottom: "1px solid " + COLORS.border }}><Badge color={r.color}>{r.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
    <Card title="通知設定" style={{ backgroundColor: "#FFF9E6" }}>
      <div style={{ fontSize: 12, lineHeight: 1.8 }}>
        <div>会計日3日前: 支払期日の3日前にダッシュボード通知 + LINE連携でリマインド</div>
        <div>未入金リマインド: 未入金の利用者へダッシュボード通知 → LINEでリマインド連携</div>
        <div>代理店コミッション発生通知: 支払総額50%到達時に管理者へポップアップ通知</div>
        <div>分割払い対応: 3回払い・4回払い等の分割払いスケジュール管理</div>
      </div>
    </Card>
  </div>
  );
};

// ===== 11. マスタ管理画面 =====
const MasterScreen = () => {
  const [tab, setTab] = useState("source");
  return (
    <div>
      <ScreenHeader title="マスタ管理" subtitle="流入経路・成約プラン・代理店マスタの管理｜対象: 管理（管理者のみ）" />
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[["source", "流入経路マスタ"], ["plan", "成約プランマスタ"], ["agency", "代理店マスタ"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: "8px 20px", border: "1px solid " + COLORS.primary, borderRadius: "6px 6px 0 0", backgroundColor: tab === key ? COLORS.primary : "#fff", color: tab === key ? "#fff" : COLORS.primary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{label}</button>
        ))}
      </div>
      {tab === "source" && (
        <Card title="流入経路マスタ（m_sources）">
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Input label="コード" placeholder="例: META" width="150px" />
            <Input label="名称" placeholder="例: WEBシーズ_Meta" width="250px" />
            <div style={{ alignSelf: "end" }}><Button small>追加</Button></div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><TableHeader columns={["コード", "名称", "有効", "操作"]} /></thead>
            <tbody>
              {[["META", "WEBシーズ_Meta"], ["GOOGLE", "Googleリスティング"], ["TIKTOK", "TikTok"], ["LINE", "直LINE"]].map(([code, name], i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : COLORS.grayLight }}>
                  <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{code}</td>
                  <td style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{name}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid " + COLORS.border }}><Badge color={COLORS.success}>有効</Badge></td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid " + COLORS.border }}><Button small outline color={COLORS.grayDark}>編集</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {tab === "plan" && (
        <Card title="成約プランマスタ（m_plans）">
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Input label="コード" placeholder="例: PLAN10" width="120px" />
            <Input label="名称" placeholder="例: 10ヶ月プラン" width="180px" />
            <Input label="金額" placeholder="例: 280000" width="120px" />
            <Input label="説明" placeholder="プラン説明" width="250px" />
            <div style={{ alignSelf: "end" }}><Button small>追加</Button></div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><TableHeader columns={["コード", "名称", "金額", "説明", "有効", "操作"]} /></thead>
            <tbody>
              {[["PLAN10", "10ヶ月プラン", "280,000円", "標準プラン"], ["PLAN28", "28ヶ月プラン", "450,000円", "長期サポート"], ["CUSTOM", "カスタムプラン", "個別設定", "個別対応"]].map(([code, name, price, desc], i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : COLORS.grayLight }}>
                  {[code, name, price, desc].map((v, j) => <td key={j} style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{v}</td>)}
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid " + COLORS.border }}><Badge color={COLORS.success}>有効</Badge></td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid " + COLORS.border }}><Button small outline color={COLORS.grayDark}>編集</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {tab === "agency" && (
        <Card title="代理店マスタ（m_agencies）">
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <Input label="コード" placeholder="例: AG001" width="100px" />
            <Input label="店舗名" placeholder="例: 代理店A" width="160px" />
            <Input label="連絡先" placeholder="例: 03-XXXX-XXXX" width="150px" />
            <Input label="振込先" placeholder="銀行口座情報" width="200px" />
            <Input label="手数料率(%)" placeholder="25" width="80px" />
            <div style={{ alignSelf: "end" }}><Button small>追加</Button></div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><TableHeader columns={["コード", "店舗名", "連絡先", "振込先", "手数料率", "有効", "操作"]} /></thead>
            <tbody>
              {[["AG001", "代理店A", "03-1234-5678", "○○銀行 △△支店", "25%"], ["AG002", "代理店B", "06-9876-5432", "□□銀行 ◇◇支店", "25%"]].map(([code, name, contact, bank, rate], i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : COLORS.grayLight }}>
                  {[code, name, contact, bank, rate].map((v, j) => <td key={j} style={{ padding: "8px 10px", fontSize: 12, borderBottom: "1px solid " + COLORS.border }}>{v}</td>)}
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid " + COLORS.border }}><Badge color={COLORS.success}>有効</Badge></td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid " + COLORS.border }}><Button small outline color={COLORS.grayDark}>編集</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

// ===== メインアプリ =====
const SCREENS = {
  login: { component: LoginScreen, label: "1. ログイン", color: COLORS.primary },
  dashboard: { component: DashboardScreen, label: "2. ダッシュボード", color: COLORS.success },
  deal_input: { component: DealInputScreen, label: "3. 商談入力", color: COLORS.primaryLight },
  deal_list: { component: DealListScreen, label: "4. 商談一覧", color: COLORS.primaryLight },
  deal_detail: { component: DealDetailScreen, label: "5. 商談詳細", color: COLORS.primaryLight },
  review_mgmt: { component: ReviewMgmtScreen, label: "6. 検討管理", color: COLORS.warning },
  deal_detail_input: { component: DealDetailInputScreen, label: "7. 成約詳細入力", color: COLORS.primaryLight },
  approval: { component: ApprovalScreen, label: "8. 事務承認", color: COLORS.warning },
  contract: { component: ContractScreen, label: "9. 締結", color: COLORS.purple },
  payment: { component: PaymentScreen, label: "10. 支払管理", color: COLORS.danger },
  master: { component: MasterScreen, label: "11. マスタ管理", color: COLORS.purple },
};

export default function App() {
  const [screen, setScreen] = useState("login");
  const Current = SCREENS[screen].component;
  return (
    <div style={{ fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif", backgroundColor: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ backgroundColor: "#1a2332", padding: "0 16px", display: "flex", alignItems: "center", height: 44, overflowX: "auto" }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginRight: 16, whiteSpace: "nowrap" }}>商談管理システム</span>
        <div style={{ display: "flex", gap: 2 }}>
          {Object.entries(SCREENS).map(([key, { label, color }]) => (
            <button key={key} onClick={() => setScreen(key)} style={{ padding: "6px 10px", border: "none", borderRadius: "4px 4px 0 0", backgroundColor: screen === key ? color : "transparent", color: screen === key ? "#fff" : "#8899AA", fontSize: 11, fontWeight: screen === key ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid " + COLORS.border, padding: "4px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: COLORS.textLight }}>
          ロール: <Badge color={COLORS.primary}>営業</Badge> <Badge color={COLORS.warning}>事務</Badge> <Badge color={COLORS.purple}>管理</Badge>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textLight }}>ステータス遷移: 新規→面談済→成約/検討/対象外→詳細入力済→事務承認済→締結済→支払管理中→完了</div>
      </div>
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <Current onNavigate={setScreen} />
      </div>
    </div>
  );
}
