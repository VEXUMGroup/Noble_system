import { addDaysToYmd, getDaysUntilYmd, getJstTodayYmd, isYmd } from './date-utils';

export type PaymentReminderDeal = {
  id: string;
  customer_name: string;
  assigned_to: string | null;
  payment_deadline: string | null;
  amount: number | string | null;
};

export type PaymentReminderRecord = {
  deal_id: string;
  amount: number;
};

export type PaymentReminderTarget = {
  dealId: string;
  customerName: string;
  assignedTo: string;
  paymentDeadline: string;
  amount: number;
  paidAmount: number;
  unpaidAmount: number;
  reminderKey: string;
  targetDate: string;
};

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function buildPaymentReminderTargets(
  deals: PaymentReminderDeal[],
  paymentRecords: PaymentReminderRecord[],
  referenceDate = new Date()
): PaymentReminderTarget[] {
  const todayYmd = getJstTodayYmd(referenceDate);
  const targetDate = addDaysToYmd(todayYmd, 3);
  const paymentTotals = new Map<string, number>();

  for (const record of paymentRecords) {
    paymentTotals.set(record.deal_id, (paymentTotals.get(record.deal_id) ?? 0) + toNumber(record.amount));
  }

  return deals.flatMap((deal) => {
    const paymentDeadline = typeof deal.payment_deadline === 'string' ? deal.payment_deadline : '';
    if (!isYmd(paymentDeadline)) return [];
    if (getDaysUntilYmd(paymentDeadline, referenceDate) !== 3) return [];
    if (!deal.assigned_to) return [];

    const amount = toNumber(deal.amount);
    if (amount <= 0) return [];

    const paidAmount = paymentTotals.get(deal.id) ?? 0;
    if (paidAmount > 0) return [];

    const unpaidAmount = Math.max(amount - paidAmount, 0);
    return [
      {
        dealId: deal.id,
        customerName: deal.customer_name,
        assignedTo: deal.assigned_to,
        paymentDeadline,
        amount,
        paidAmount,
        unpaidAmount,
        reminderKey: `payment_due_3days:${deal.id}:${paymentDeadline}`,
        targetDate,
      },
    ];
  });
}

