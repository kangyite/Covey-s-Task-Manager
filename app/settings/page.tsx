'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import SettingsForm from '@/components/SettingsForm';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types';

function SettingsContent() {
  const [settings, setSettings] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function fetchSettings() {
      try {
        // If redirected back after calendar OAuth, grab the provider_token client-side and save it
        if (searchParams.get('calendar_enabled') === '1') {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          const providerToken = session?.provider_token;

          if (providerToken) {
            await fetch('/api/profile/save-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ provider_token: providerToken }),
            });
          }

          // Enable calendar in settings
          await fetch('/api/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calendar_enabled: true }),
          });

          router.replace('/settings');
          return;
        }

        const res = await fetch('/api/settings');
        if (res.ok) {
          const { settings: data } = await res.json();
          setSettings(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [searchParams, router]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : settings ? (
        <SettingsForm settings={settings} onUpdate={setSettings} />
      ) : null}
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
