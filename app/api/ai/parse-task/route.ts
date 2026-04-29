import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_PROMPT = `You are a task management assistant for the Covey Time Management Matrix.
Given a user's description of a task or requirement, extract and return a JSON object with these fields:
- title: string (concise task title, max 255 chars, required)
- description: string (add if there is additional information from the user, otherwise empty string)
- quadrant: "Q1" | "Q2" | "Q3" | "Q4" (required)
  - Q1 = Important + Urgent (deadlines, crises, critical issues)
  - Q2 = Important + Not Urgent (planning, learning, relationships, prevention)
  - Q3 = Not Important + Urgent (interruptions, some meetings, some emails)
  - Q4 = Not Important + Not Urgent (time wasters, trivial tasks)
- deadline: string | null (ISO 8601 datetime if a deadline is mentioned, otherwise null)
- urgency_threshold_days: number | null (days before deadline to escalate, only if deadline is set and urgency is implied)

Respond ONLY with valid JSON, no markdown, no explanation.

Example input: "Fix the critical login bug by tomorrow"
Example output: {"title":"Fix critical login bug","description":"Login is broken and needs immediate attention","quadrant":"Q1","deadline":"${new Date(Date.now() + 86400000).toISOString()}","urgency_threshold_days":null}`;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prompt } = await request.json();
  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://covey-s-task-manager.vercel.app',
        'X-Title': 'Covey Task Manager',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error: ${res.status} ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';

    // Strip markdown code fences if present
    const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(json);

    return NextResponse.json({ task: parsed });
  } catch (err) {
    console.error('OpenRouter parse error:', err);
    return NextResponse.json({ error: 'Failed to parse task from input' }, { status: 500 });
  }
}
