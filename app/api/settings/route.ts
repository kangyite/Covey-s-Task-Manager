import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteCalendarEvent } from '@/lib/calendar';
import type { UserProfile } from '@/lib/types';

export async function GET() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, calendar_enabled')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profile) {
    const { data: newProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, calendar_enabled: false })
      .select('id, calendar_enabled')
      .single();

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ settings: newProfile as UserProfile });
  }

  return NextResponse.json({ settings: profile as UserProfile });
}

export async function PATCH(request: NextRequest) {
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

  const input = body as Record<string, unknown>;
  if (typeof input.calendar_enabled !== 'boolean') {
    return NextResponse.json(
      { error: 'calendar_enabled must be a boolean' },
      { status: 400 }
    );
  }

  // Check if we're transitioning from enabled → disabled
  if (input.calendar_enabled === false) {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('calendar_enabled')
      .eq('id', user.id)
      .single();

    if (currentProfile?.calendar_enabled === true) {
      // Fetch all tasks with a calendar_event_id
      const { data: tasksWithEvents } = await supabase
        .from('tasks')
        .select('id, calendar_event_id')
        .eq('user_id', user.id)
        .not('calendar_event_id', 'is', null);

      if (tasksWithEvents && tasksWithEvents.length > 0) {
        // Get the provider token from the profile
        const { data: profileWithToken } = await supabase
          .from('profiles')
          .select('provider_token')
          .eq('id', user.id)
          .single();
        const accessToken = profileWithToken?.provider_token;

        // Delete each calendar event, catching errors per event
        if (accessToken) {
          await Promise.all(
            tasksWithEvents.map(async (task) => {
              try {
                await deleteCalendarEvent(accessToken, task.calendar_event_id!);
              } catch {
                // Ignore per-event errors — don't fail the whole operation
              }
            })
          );
        }

        // Clear calendar_event_id on all those task records
        const taskIds = tasksWithEvents.map((t) => t.id);
        await supabase
          .from('tasks')
          .update({ calendar_event_id: null })
          .in('id', taskIds);
      }
    }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, calendar_enabled: input.calendar_enabled })
    .select('id, calendar_enabled')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: profile as UserProfile });
}
