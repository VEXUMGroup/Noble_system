import { NextRequest, NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizeOptions, validateKeyName, type DealCustomFieldType } from '@/lib/custom-fields';

async function requireManagerRole(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: member, error } = await supabase
    .from('m_users')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!member || member.role !== 'manager') throw new Error('forbidden');
}

export async function GET() {
  const session = await readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('deal_custom_fields')
    .select('*')
    .order('order_index', { ascending: true })
    .order('id', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    await requireManagerRole(session.userId);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'forbidden';
    return NextResponse.json({ error: message }, { status: message === 'forbidden' ? 403 : 500 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        key_name?: string;
        field_type?: DealCustomFieldType;
        options?: string[];
        required?: boolean;
        order_index?: number;
        visible_roles?: string[];
        is_active?: boolean;
      }
    | null;

  if (!body?.name || !body.key_name || !body.field_type) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  try {
    validateKeyName(body.key_name);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'invalid_key' }, { status: 400 });
  }

  const optionsJson =
    body.field_type === 'select' || body.field_type === 'checkbox'
      ? normalizeOptions(body.options ?? []).length > 0
        ? normalizeOptions(body.options ?? [])
        : []
      : null;

  const supabase = createSupabaseAdminClient();
  const payload = {
    name: body.name,
    key_name: body.key_name,
    field_type: body.field_type,
    options_json: optionsJson,
    required: Boolean(body.required),
    order_index: typeof body.order_index === 'number' ? body.order_index : 0,
    visible_roles: Array.isArray(body.visible_roles) && body.visible_roles.length > 0 ? body.visible_roles : ['manager'],
    is_active: body.is_active !== false,
  };

  const { data, error } = await supabase.from('deal_custom_fields').insert(payload).select('*').maybeSingle();
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'duplicate_key_name' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}
