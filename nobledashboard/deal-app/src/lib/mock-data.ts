import { contractPlanOptions, paymentMethodOptions, paymentPlanOptions } from './constants';

export type MockDeal = {
  id: string;
  customer_name: string;
  contract_plan?: string;
  contract_plan_other?: string;
  payment_plan?: string;
  payment_method?: string;
  payment_deadline?: string;
  irregular_notes?: string;
  status?: string;
  updated_at?: string;
};

export const mockDeals: MockDeal[] = [
  {
    id: 'deal-001',
    customer_name: 'サンプル太郎',
    contract_plan: '12ヶ月',
    payment_plan: '一括',
    payment_method: 'transfer',
    payment_deadline: '初回面談後7日以内',
    status: 'DETAIL_ENTERED',
  },
  {
    id: 'deal-002',
    customer_name: 'サンプル花子',
    contract_plan: 'その他',
    contract_plan_other: '24ヶ月',
    payment_plan: '分割',
    payment_method: 'card',
    payment_deadline: '月末締め翌月払い',
    status: 'CONTRACTED',
  },
];

export { contractPlanOptions, paymentPlanOptions, paymentMethodOptions };
