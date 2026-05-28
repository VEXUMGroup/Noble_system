export type DealCustomFieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox';

export type DealCustomFieldDefinition = {
  id: number;
  name: string;
  key_name: string;
  field_type: DealCustomFieldType;
  options_json: unknown | null;
  required: boolean;
  order_index: number;
  visible_roles: unknown;
  is_active: boolean;
};

export type DealCustomData = Record<string, unknown>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function normalizeOptions(optionsJson: unknown): string[] {
  if (!optionsJson) return [];
  if (Array.isArray(optionsJson)) return optionsJson.map(String).filter((v) => v.length > 0);
  return [];
}

export function validateKeyName(keyName: string) {
  if (!/^[a-z][a-z0-9_]{1,49}$/i.test(keyName)) {
    throw new Error('Key は英数字とアンダースコアのみ（2〜50文字）で入力してください');
  }
}

export function validateCustomDataOrThrow(
  defs: Pick<
    DealCustomFieldDefinition,
    'name' | 'key_name' | 'field_type' | 'options_json' | 'required' | 'is_active'
  >[],
  customData: DealCustomData
) {
  for (const def of defs) {
    if (!def.is_active) continue;
    const value = customData?.[def.key_name];

    if (def.required) {
      const missing =
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0);
      if (missing) throw new Error(`「${def.name}」は必須です`);
    }

    if (value === undefined || value === null || value === '') continue;

    switch (def.field_type) {
      case 'text': {
        // allow anything stringifiable
        break;
      }
      case 'number': {
        const num = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(num)) throw new Error(`「${def.name}」は数値である必要があります`);
        break;
      }
      case 'date': {
        if (!isNonEmptyString(value)) throw new Error(`「${def.name}」は日付形式である必要があります`);
        const ms = Date.parse(value);
        if (Number.isNaN(ms)) throw new Error(`「${def.name}」は日付形式である必要があります`);
        break;
      }
      case 'select': {
        const options = normalizeOptions(def.options_json);
        const v = String(value);
        if (v && options.length > 0 && !options.includes(v)) {
          throw new Error(`「${def.name}」の選択肢が不正です`);
        }
        break;
      }
      case 'checkbox': {
        const options = normalizeOptions(def.options_json);
        const arr = Array.isArray(value) ? value.map(String) : [String(value)];
        if (options.length > 0 && arr.some((v) => v && !options.includes(v))) {
          throw new Error(`「${def.name}」の選択肢が不正です`);
        }
        break;
      }
      default: {
        // exhaustive
        break;
      }
    }
  }
}

