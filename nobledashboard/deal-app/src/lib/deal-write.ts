type SupabaseWriteError = {
  code?: string;
  message?: string;
  details?: string;
};

type SupabaseWriteResult<T> = {
  data: T | null;
  error: SupabaseWriteError | null;
};

export function isMissingCustomDataColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const { code, message, details } = error as SupabaseWriteError;
  const haystack = `${code ?? ''} ${message ?? ''} ${details ?? ''}`.toLowerCase();

  return (
    haystack.includes('custom_data') &&
    (haystack.includes('schema cache') || haystack.includes('could not find') || code === 'PGRST204')
  );
}

export function stripCustomDataColumn<T extends Record<string, unknown>>(payload: T): Omit<T, 'custom_data'> {
  const { custom_data: _customData, ...rest } = payload;
  return rest;
}

export function nullIfEmpty(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function writeDealWithCustomDataFallback<T>(
  context: string,
  writeWithCustomData: () => Promise<SupabaseWriteResult<T>>,
  writeWithoutCustomData: () => Promise<SupabaseWriteResult<T>>
): Promise<SupabaseWriteResult<T>> {
  const firstResult = await writeWithCustomData();
  if (!isMissingCustomDataColumnError(firstResult.error)) {
    return firstResult;
  }

  console.warn(`[${context}] custom_data column is unavailable; retrying without custom_data`);
  return await writeWithoutCustomData();
}
