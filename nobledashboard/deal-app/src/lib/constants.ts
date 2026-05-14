export const prospectLevels = ['A', 'B', 'C'] as const;
export const agencyTypes = ['紹介代理店', '広告', '自社'] as const;

export const hrProposalOptions = ['提案済み', '未提案', '不要'] as const;
export const hrFeasibilityOptions = ['可能', '要確認', '不可'] as const;
export const consideringReasons = ['費用検討', '家族相談', '時期調整'] as const;
export const outOfScopeReasons = ['条件不一致', '対象外職種', 'その他'] as const;
export const lostReasons = ['他社決定', '連絡不可', '予算不一致'] as const;

export const contractPlanOptions = ['10ヶ月', '12ヶ月', '18ヶ月', '24ヶ月', '28ヶ月', '30ヶ月', 'その他'] as const;
export const paymentPlanOptions = ['一括', '分割', '完全成功'] as const;
export const paymentMethodOptions = [
  { value: 'transfer', label: '銀行振込' },
  { value: 'card', label: 'クレジットカード' },
  { value: 'stripe', label: 'Stripe自動決済' },
] as const;
