import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership — RLS also enforces this, but we check explicitly for a clear 404
  const { data: existing, error: fetchError } = await supabase
    .from('completed_tasks')
    .select('id, user_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Completed task not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('completed_tasks')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
