import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Task } from '@/lib/types';

type RouteContext = { params: { id: string } };

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the completed task, verifying ownership
  const { data: completed, error: fetchError } = await supabase
    .from('completed_tasks')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !completed) {
    return NextResponse.json({ error: 'Completed task not found' }, { status: 404 });
  }

  // Re-insert into active tasks using original_quadrant
  const { data: task, error: insertError } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: completed.title,
      quadrant: completed.original_quadrant,
      deadline: completed.deadline ?? null,
    })
    .select()
    .single();

  if (insertError || !task) {
    return NextResponse.json({ error: insertError?.message ?? 'Failed to restore task' }, { status: 500 });
  }

  // Delete the completed_task record
  const { error: deleteError } = await supabase
    .from('completed_tasks')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ task: task as Task });
}
