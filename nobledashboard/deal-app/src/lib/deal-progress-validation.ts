export type DealProgressInput = {
  assigned_to: string;
  deal_date: string;
  age: string;
  email: string;
  source: string;
  referrer: string;
};

export type DealProgressField = keyof DealProgressInput;

export type DealProgressErrors = Partial<Record<DealProgressField, string>>;

export type DealProgressValidationResult = {
  normalized: DealProgressInput;
  errors: DealProgressErrors;
  isValid: boolean;
  missingFields: DealProgressField[];
};

export type DealProgressValidationOptions = {
  sourceCodes?: string[];
  agencyCodes?: string[];
};

const FIELD_LABELS: Record<DealProgressField, string> = {
  assigned_to: '担当',
  deal_date: '商談日',
  age: '年齢',
  email: 'メールアドレス',
  source: '流入経路',
  referrer: '紹介者',
};

function normalizeText(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getDealProgressFieldLabel(field: DealProgressField): string {
  return FIELD_LABELS[field];
}

export function getDealProgressValidationMessage(result: Pick<DealProgressValidationResult, 'errors' | 'missingFields'>): string {
  const firstError = Object.values(result.errors).find(Boolean);
  if (firstError) return firstError;
  if (result.missingFields.length === 0) return '必須項目を確認してください';
  return `未入力の項目があります: ${result.missingFields.map(getDealProgressFieldLabel).join('、')}`;
}

export function validateDealProgressInput(
  input: Partial<DealProgressInput>,
  options: DealProgressValidationOptions = {}
): DealProgressValidationResult {
  const normalized: DealProgressInput = {
    assigned_to: normalizeText(input.assigned_to),
    deal_date: normalizeText(input.deal_date),
    age: normalizeText(input.age),
    email: normalizeText(input.email),
    source: normalizeText(input.source),
    referrer: normalizeText(input.referrer),
  };

  const errors: DealProgressErrors = {};
  const missingFields: DealProgressField[] = [];
  const sourceCodes = options.sourceCodes ?? [];
  const agencyCodes = options.agencyCodes ?? [];
  const hasSource = normalized.source.length > 0;
  const hasReferrer = normalized.referrer.length > 0;

  if (!normalized.assigned_to) {
    errors.assigned_to = '必須項目です';
    missingFields.push('assigned_to');
  }
  if (!normalized.deal_date) {
    errors.deal_date = '必須項目です';
    missingFields.push('deal_date');
  } else if (!isYmd(normalized.deal_date)) {
    errors.deal_date = '日付の形式が不正です';
  }
  if (!normalized.age) {
    errors.age = '必須項目です';
    missingFields.push('age');
  }
  if (!normalized.email) {
    errors.email = '必須項目です';
    missingFields.push('email');
  }

  if (!hasSource && !hasReferrer) {
    const message = '流入経路または紹介者のどちらか一方を入力してください';
    errors.source = message;
    errors.referrer = message;
    missingFields.push('source', 'referrer');
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
    missingFields,
  };
}
