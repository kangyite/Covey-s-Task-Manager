import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const next = searchParams.get('next') ?? '/matrix';

  if (error) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`);
  }

  if (code) {
    const supabase = createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError && data.session) {
      // Persist provider_token so server-side API routes can use it for Calendar API calls
      const providerToken = data.session.provider_token;
      console.log('[auth/callback] provider_token present:', !!providerToken);
      console.log('[auth/callback] user id:', data.session.user.id);
      if (providerToken) {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            { id: data.session.user.id, provider_token: providerToken },
            { onConflict: 'id' }
          );
        if (upsertError) {
          console.error('Failed to save provider_token:', upsertError.message);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(exchangeError?.message ?? 'Exchange failed')}`
    );
  }

  return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('Missing authorization code')}`);
}
