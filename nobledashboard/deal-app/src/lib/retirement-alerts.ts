import { getDaysUntilYmd, isYmd } from './date-utils';

const REVIEW_TARGET_STATUS_CODES = new Set(['RS_IN_PROG', 'RS_REDEAL']);
const RETIREMENT_ALERT_DAYS_BEFORE = 14;

export type RetirementAlertDeal = {
  id: string;
  customer_name: string;
  assigned_to: string | null;
  status: string | null;
  retirement_date: string | null;
};

export type RetirementAlertTarget = {
  dealId: string;
  customerName: string;
  assignedTo: string;
  retirementDate: string;
  reminderKey: string;
};

export function buildRetirementAlertTargets(
  deals: RetirementAlertDeal[],
  referenceDate = new Date()
): RetirementAlertTarget[] {
  return deals.flatMap((deal) => {
    if (!REVIEW_TARGET_STATUS_CODES.has(String(deal.status ?? ''))) return [];

    const retirementDate = typeof deal.retirement_date === 'string' ? deal.retirement_date : '';
    if (!isYmd(retirementDate)) return [];
    if (getDaysUntilYmd(retirementDate, referenceDate) !== RETIREMENT_ALERT_DAYS_BEFORE) return [];
    if (!deal.assigned_to) return [];

    return [
      {
        dealId: deal.id,
        customerName: deal.customer_name,
        assignedTo: deal.assigned_to,
        retirementDate,
        reminderKey: `retirement_alert:${deal.id}:${retirementDate}`,
      },
    ];
  });
}
