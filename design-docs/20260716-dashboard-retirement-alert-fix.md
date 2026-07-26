# 2026-07-16 ダッシュボード退職アラート不具合修正

## 対象
- `nobledashboard/deal-app/src/app/(authenticated)/dashboard/page.tsx`

## 修正内容
- ダッシュボードの案件データ参照先を `mockDeals` から実データ取得 (`useDeals`) に切り替える。
- 担当者表示はマスタデータ (`useMasterData`) から解決する。
- 営業ユーザーは自分の案件のみ表示する既存の一覧画面方針に合わせるため、`useCurrentUser` を利用する。
- 退職予定日までの日数判定は JST の日付差分 (`getDaysUntilYmd`) を使い、時刻差によるブレを避ける。

## 期待結果
- 退職予定日が 14 日以内で、検討管理対象 (`RS_IN_PROG`, `RS_REDEAL`) の案件がある場合にダッシュボードのポップアップとアラート欄へ表示される。
- 退職予定日が 30 日以内の案件が「今後1ヶ月の退職予定」に表示される。
