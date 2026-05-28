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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    await requireManagerRole(session.userId);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'forbidden';
    return NextResponse.json({ error: message }, { status: message === 'forbidden' ? 403 : 500 });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

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

  if (!body) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  if (body.key_name) {
    try {
      validateKeyName(body.key_name);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : 'invalid_key' }, { status: 400 });
    }
  }

  const supabase = createSupabaseAdminClient();
  const patch: Record<string, unknown> = {};
  if (typeof body.name === 'string') patch.name = body.name;
  if (typeof body.key_name === 'string') patch.key_name = body.key_name;
  if (typeof body.field_type === 'string') patch.field_type = body.field_type;
  if (typeof body.required === 'boolean') patch.required = body.required;
  if (typeof body.order_index === 'number') patch.order_index = body.order_index;
  if (Array.isArray(body.visible_roles)) patch.visible_roles = body.visible_roles;
  if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;

  if (body.field_type === 'select' || body.field_type === 'checkbox') {
    patch.options_json = normalizeOptions(body.options ?? []);
  } else if (body.field_type) {
    patch.options_json = null;
  }

  const { data, error } = await supabase
    .from('deal_custom_fields')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'duplicate_key_name' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    await requireManagerRole(session.userId);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'forbidden';
    return NextResponse.json({ error: message }, { status: message === 'forbidden' ? 403 : 500 });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('deal_custom_fields').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

