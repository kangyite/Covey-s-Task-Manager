import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyEscalation } from '@/lib/escalation';
import type { Task } from '@/lib/types';

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse optional body
  let taskIds: string[] | undefined;
  try {
    const body = await request.json();
    if (body && Array.isArray(body.task_ids)) {
      taskIds = body.task_ids as string[];
    }
  } catch {
    // Empty or missing body is fine — check all tasks
  }

  // Fetch eligible tasks (user's tasks, optionally filtered by task_ids)
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id);

  if (taskIds && taskIds.length > 0) {
    query = query.in('id', taskIds);
  }

  const { data: tasks, error: fetchError } = await query;
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const originalTasks = tasks as Task[];
  const escalatedTasks = applyEscalation(originalTasks);

  // Determine which tasks actually changed (newly escalated)
  const changed = escalatedTasks.filter((t, i) => t.escalated && !originalTasks[i].escalated);

  if (changed.length > 0) {
    // Batch-update escalated tasks in Supabase
    const updates = changed.map((t) =>
      supabase
        .from('tasks')
        .update({
          quadrant: t.quadrant,
          escalated: true,
          pre_escalation_quadrant: t.pre_escalation_quadrant,
        })
        .eq('id', t.id)
        .eq('user_id', user.id)
    );

    const results = await Promise.all(updates);
    const updateError = results.find((r) => r.error);
    if (updateError?.error) {
      return NextResponse.json({ error: updateError.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ escalated: changed.map((t) => t.id) });
}
