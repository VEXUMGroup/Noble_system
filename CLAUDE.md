# CLAUDE.md｜壁打ちメモ

> ここに「今やりたいこと」を書き出す壁打ち用ドキュメント。
> Claude はこのファイルを読んで作業内容を理解する。

---

## 1. 今やりたいこと（ゴール）

- マスタ管理画面（流入経路 / 成約プラン / 代理店 / 担当者）を Supabase の実データに置き換える
- 既存画面のプルダウン（流入経路・代理店・担当者）も Supabase から動的取得に変更する

---

## 2. 背景・現状

- 001_initial_schema.sql で 4 つのマスタテーブル（m_users / m_sources / m_plans / m_agencies）は作成済み
- フロント側はすべて mock-data.ts のモック配列を参照していて DB と接続されていなかった
- マスタ画面は UI はあるが「+追加」もメモリ内のモック配列を書き換えるだけでリロードで消える

---

## 3. 対象範囲

- 対象ブランチ: 現状のワーキングコピー
- 対象画面 / ファイル:
  - `supabase/migrations/002_master_tables.sql`（新規）
  - `src/lib/supabase.ts`（CRUD 追加）
  - `src/lib/useMasterData.ts`（新規・読取専用フック）
  - `src/app/(authenticated)/master/page.tsx`（実データ化）
  - `src/app/(authenticated)/deals/page.tsx`（フィルタのプルダウン）
  - `src/app/(authenticated)/deals/new/page.tsx`（担当者・流入経路）
  - `src/app/(authenticated)/deals/[id]/page.tsx`（顧客詳細編集の担当者・流入経路・代理店）
- 触らない範囲:
  - mock-data.ts のラベル lookup（`getUserName` 等）— 商談データ自体がまだモックなので一旦残す
  - deals/[id]/contract, deals/[id]/approval, review, dashboard — プルダウンを持たないので未着手

---

## 4. 残したいこと / 戻したいこと

| 項目 | 残す | 戻す | メモ |
|---|---|---|---|
| 001_initial_schema.sql の seed | ◯ |  | サンプルデータとして温存 |
| mock-data.ts のラベル lookup | ◯ |  | 商談がモックの間は併用 |
| FORM_SOURCES（deals/new の固定配列） |  | ◯ | DB 取得に統合（削除済み） |
| マスタ画面の「+追加」モック書き込み |  | ◯ | Supabase create に置換済み |

---

## 5. 判断に迷っているところ

- 開発用に RLS は無効化（002）。本番投入前に role ベースのポリシー設計が必要
- 担当者 ID は `USR001` 連番で自動採番（`nextUserId`）。サインアップ連携が入ったら見直す
- mock-data の 4 配列は現状フォールバック用に残してある。商談本体を DB 化したタイミングで削除する

---

## 6. 完了の定義

- [x] 002_master_tables.sql でトリガ・インデックス・RLS 設定が入っている
- [x] supabase.ts に 4 マスタの get / create / update / delete + nextUserId が揃う
- [x] master/page.tsx が Supabase から読み書きする（4 タブ全て、削除も可能）
- [x] deals 系画面のプルダウンが `useMasterData()` 経由で DB 取得に切り替わる
- [x] `npx tsc --noEmit` がエラーなく通る

---

## 7. メモ・参考リンク

- マイグレーション適用：`supabase db push` もしくは Supabase ダッシュボードの SQL Editor で 002 を流す
- 既存バグ修正：`deals/new/page.tsx` の `inputCls` 宣言と `inputClass` 参照の不一致を修正（型チェックを通すため）
- 検証：`npx next build` は 45 秒のサンドボックス制限内で完走しなかったため、型チェック（`tsc --noEmit`）で確認

---

_最終更新：2026-04-30_
