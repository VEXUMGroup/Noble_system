export type DealCustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'email'
  | 'tel'
  | 'select'
  | 'boolean';

export type DealCustomFieldDefinition = {
  id?: string;
  name?: string;
  label?: string;
  field_type?: DealCustomFieldType;
  is_active?: boolean;
  options?: string[] | null;
  [key: string]: unknown;
};
