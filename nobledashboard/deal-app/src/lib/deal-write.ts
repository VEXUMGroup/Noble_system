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

export function extractMissingColumns(error: unknown): string[] {
  if (!error || typeof error !== 'object') return [];

  const { code, message, details } = error as SupabaseWriteError;
  const haystack = `${code ?? ''} ${message ?? ''} ${details ?? ''}`;
  const normalized = haystack.toLowerCase();

  const looksLikeMissingColumn =
    normalized.includes('schema cache') ||
    normalized.includes('could not find') ||
    normalized.includes('does not exist') ||
    code === 'PGRST204' ||
    code === '42703';

  if (!looksLikeMissingColumn) {
    return [];
  }

  const matches = new Set<string>();
  const quotedColumnPatterns = [
    /'([^']+)'\s+column/gi,
    /could not find the '([^']+)' column/gi,
    /column\s+([a-zA-Z0-9_.]+)\s+does not exist/gi,
  ];
  for (const pattern of quotedColumnPatterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(haystack)) !== null) {
      const column = (match[1] ?? '').split('.').pop()?.trim();
      if (column) matches.add(column);
    }
  }
  return Array.from(matches);
}

export function stripColumns<T extends Record<string, unknown>>(
  payload: T,
  columns: string[]
): Record<string, unknown> {
  const next = { ...payload } as Record<string, unknown>;
  for (const column of columns) {
    delete next[column];
  }
  return next;
}

export function nullIfEmpty(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function writeDealWithMissingColumnFallback<T>(
  context: string,
  payload: Record<string, unknown>,
  write: (payload: Record<string, unknown>) => Promise<SupabaseWriteResult<T>>
): Promise<SupabaseWriteResult<T>> {
  let currentPayload: Record<string, unknown> = { ...payload };
  const strippedColumns = new Set<string>();

  for (let attempt = 0; attempt < Object.keys(payload).length + 2; attempt += 1) {
    const result = await write(currentPayload);
    const missingColumns = extractMissingColumns(result.error).filter((column) => !strippedColumns.has(column));

    if (missingColumns.length === 0) {
      return result;
    }

    missingColumns.forEach((column) => strippedColumns.add(column));
    console.warn(
      `[${context}] missing columns detected: ${missingColumns.join(', ')}; retrying without those columns`
    );
    currentPayload = stripColumns(currentPayload, missingColumns);
  }

  return await write(currentPayload);
}
