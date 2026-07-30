import { getJstTodayYmd, isYmd } from './date-utils';

const REVIEW_TARGET_STATUS_CODES = new Set(['RS_IN_PROG', 'RS_REDEAL']);

export type NextActionDeal = {
  id: string;
  customer_name: string;
  assigned_to: string | null;
  status: string | null;
  next_action_date: string | null;
};

export type NextActionTarget = {
  dealId: string;
  customerName: string;
  assignedTo: string;
  nextActionDate: string;
  reminderKey: string;
};

export function buildNextActionTargets(
  deals: NextActionDeal[],
  referenceDate = new Date()
): NextActionTarget[] {
  const todayYmd = getJstTodayYmd(referenceDate);

  return deals.flatMap((deal) => {
    if (!REVIEW_TARGET_STATUS_CODES.has(String(deal.status ?? ''))) return [];

    const nextActionDate = typeof deal.next_action_date === 'string' ? deal.next_action_date : '';
    if (!isYmd(nextActionDate)) return [];
    if (nextActionDate !== todayYmd) return [];
    if (!deal.assigned_to) return [];

    return [
      {
        dealId: deal.id,
        customerName: deal.customer_name,
        assignedTo: deal.assigned_to,
        nextActionDate,
        reminderKey: `next_action_today:${deal.id}:${nextActionDate}`,
      },
    ];
  });
}
