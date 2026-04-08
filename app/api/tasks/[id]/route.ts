import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validatePartialTaskInput } from '@/lib/validation';
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/calendar';
import type { Task } from '@/lib/types';

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  const validation = validatePartialTaskInput(body);
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  // Verify ownership — RLS also enforces this, but we check explicitly for a clear 404
  const { data: existing, error: fetchError } = await supabase
    .from('tasks')
    .select('id, user_id, calendar_event_id, deadline, title')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const input = body as Record<string, unknown>;

  // Build the update payload from provided fields
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ('title' in input) updates.title = (input.title as string).trim();
  if ('description' in input) updates.description = input.description ?? null;
  if ('quadrant' in input) updates.quadrant = input.quadrant;
  if ('deadline' in input) updates.deadline = input.deadline ?? null;
  if ('urgency_threshold_days' in input) updates.urgency_threshold_days = input.urgency_threshold_days ?? null;

  // Req 4.4: when deadline is cleared, also clear urgency_threshold_days and reset escalation fields
  if ('deadline' in input && (input.deadline === null || input.deadline === undefined || input.deadline === '')) {
    updates.urgency_threshold_days = null;
    updates.escalated = false;
    updates.pre_escalation_quadrant = null;
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const updatedTask = task as Task;

  // Calendar sync: update event if calendar_enabled and task has a calendar_event_id
  const effectiveDeadline = ('deadline' in input ? input.deadline : existing.deadline) as string | null | undefined;
  const effectiveTitle = ('title' in input ? (input.title as string).trim() : existing.title) as string;
  const effectiveEventId = existing.calendar_event_id as string | null | undefined;

  if (effectiveEventId && effectiveDeadline) {
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
          await updateCalendarEvent(accessToken, effectiveEventId, effectiveTitle, effectiveDeadline);
        }
      }
    } catch (calendarError) {
      console.error('Calendar sync error on task update:', calendarError);
    }
  }

  return NextResponse.json({ task: updatedTask });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('tasks')
    .select('id, user_id, calendar_event_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Calendar sync: delete event before deleting the task
  if (existing.calendar_event_id) {
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
          await deleteCalendarEvent(accessToken, existing.calendar_event_id as string);
        }
      }
    } catch (calendarError) {
      console.error('Calendar sync error on task delete:', calendarError);
    }
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
