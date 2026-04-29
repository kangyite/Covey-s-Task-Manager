import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteCalendarEvent } from '@/lib/calendar';
import type { CompletedTask } from '@/lib/types';

type RouteContext = { params: { id: string } };

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const supabase = createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Fetch the task, verifying ownership
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('id, user_id, title, quadrant, deadline, calendar_event_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // 3. Insert into completed_tasks
  const { data: completedTask, error: insertError } = await supabase
    .from('completed_tasks')
    .insert({
      user_id: user.id,
      title: task.title,
      original_quadrant: task.quadrant,
      deadline: task.deadline ?? null,
      completion_timestamp: new Date().toISOString(),
      calendar_event_id: task.calendar_event_id ?? null,
    })
    .select()
    .single();

  if (insertError || !completedTask) {
    return NextResponse.json({ error: insertError?.message ?? 'Failed to record completion' }, { status: 500 });
  }

  // 4. Delete the active task
  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // 5. Calendar sync: delete event after completing the task
  if (task.calendar_event_id) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('calendar_enabled, provider_token')
        .eq('id', user.id)
        .single();

      if (profile?.calendar_enabled && profile?.provider_token) {
        await deleteCalendarEvent(profile.provider_token, task.calendar_event_id as string);
      }
    } catch (calendarError) {
      console.error('Calendar sync error on task complete:', calendarError);
    }
  }

  // 6. Return the completed_task record
  return NextResponse.json({ completed_task: completedTask as CompletedTask });
}
