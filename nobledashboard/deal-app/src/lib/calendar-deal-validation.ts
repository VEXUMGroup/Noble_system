export type CalendarDealInput = {
  customer_name: string;
  assigned_to: string;
  retirement_date: string;
  deal_date: string;
  age: string;
  email: string;
  source: string;
  referrer: string;
  phone?: string;
};

export type CalendarDealField = keyof Omit<CalendarDealInput, 'phone'>;

export type CalendarDealErrors = Partial<Record<CalendarDealField, string>>;

export type CalendarDealValidationOptions = {
  sourceCodes?: string[];
  agencyCodes?: string[];
};

export type CalendarDealValidationResult = {
  normalized: CalendarDealInput;
  errors: CalendarDealErrors;
  isValid: boolean;
};

function normalizeText(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateCalendarDealInput(
  input: Partial<CalendarDealInput>,
  options: CalendarDealValidationOptions = {}
): CalendarDealValidationResult {
  const normalized: CalendarDealInput = {
    customer_name: normalizeText(input.customer_name),
    assigned_to: normalizeText(input.assigned_to),
    retirement_date: normalizeText(input.retirement_date),
    deal_date: normalizeText(input.deal_date),
    age: normalizeText(input.age),
    email: normalizeText(input.email),
    source: normalizeText(input.source),
    referrer: normalizeText(input.referrer),
    phone: normalizeText(input.phone),
  };

  const errors: CalendarDealErrors = {};
  const sourceCodes = options.sourceCodes ?? [];
  const agencyCodes = options.agencyCodes ?? [];
  const hasSource = normalized.source.length > 0;
  const hasReferrer = normalized.referrer.length > 0;

  if (!normalized.customer_name) {
    errors.customer_name = '必須項目です';
  }
  if (!normalized.assigned_to) {
    errors.assigned_to = '必須項目です';
  }
  if (!normalized.retirement_date) {
    errors.retirement_date = '必須項目です';
  } else if (!isYmd(normalized.retirement_date)) {
    errors.retirement_date = '日付の形式が不正です';
  }
  if (!normalized.deal_date) {
    errors.deal_date = '必須項目です';
  } else if (!isYmd(normalized.deal_date)) {
    errors.deal_date = '日付の形式が不正です';
  }
  if (!normalized.age) {
    errors.age = '必須項目です';
  }
  if (!normalized.email) {
    errors.email = '必須項目です';
  }

  if (!hasSource && !hasReferrer) {
    const message = '流入経路または紹介者のどちらか一方を入力してください';
    errors.source = message;
    errors.referrer = message;
  } else {
    if (hasSource && sourceCodes.length > 0 && !sourceCodes.includes(normalized.source)) {
      errors.source = '有効な流入経路を選択してください';
    }
    if (hasReferrer && agencyCodes.length > 0 && !agencyCodes.includes(normalized.referrer)) {
      errors.referrer = '有効な紹介者を選択してください';
    }
  }

  return {
    normalized,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
