import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateTaskInput } from '@/lib/validation';
import { createCalendarEvent } from '@/lib/calendar';
import type { Task } from '@/lib/types';

export async function GET() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: tasks as Task[] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = validateTaskInput(body);
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const input = body as Record<string, unknown>;

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: (input.title as string).trim(),
      description: input.description ?? null,
      quadrant: input.quadrant,
      deadline: input.deadline ?? null,
      urgency_threshold_days: input.urgency_threshold_days ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let createdTask = task as Task;

  // Calendar sync: create event if calendar_enabled and task has a deadline
  if (createdTask.deadline) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('calendar_enabled')
        .eq('id', user.id)
        .single();

      if (profile?.calendar_enabled) {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.provider_token;

        if (accessToken) {
          const eventId = await createCalendarEvent(accessToken, createdTask.title, createdTask.deadline);

          const { data: updatedTask } = await supabase
            .from('tasks')
            .update({ calendar_event_id: eventId })
            .eq('id', createdTask.id)
            .select()
            .single();

          if (updatedTask) {
            createdTask = updatedTask as Task;
          }
        }
      }
    } catch (calendarError) {
      console.error('Calendar sync error on task create:', calendarError);
    }
  }

  return NextResponse.json({ task: createdTask }, { status: 201 });
}
