import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CompletedTask } from '@/lib/types';

export async function GET() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: completed_tasks, error } = await supabase
    .from('completed_tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('completion_timestamp', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ completed_tasks: completed_tasks as CompletedTask[] });
}
