import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { provider_token } = await request.json();
  if (!provider_token || typeof provider_token !== 'string') {
    return NextResponse.json({ error: 'provider_token is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, provider_token }, { onConflict: 'id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
