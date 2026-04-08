'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types';

interface SettingsFormProps {
  settings: UserProfile;
  onUpdate: (settings: UserProfile) => void;
}

export default function SettingsForm({ settings, onUpdate }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      if (!settings.calendar_enabled) {
        // Enabling: request Google Calendar OAuth scope first
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            scopes: 'https://www.googleapis.com/auth/calendar.events',
          },
        });
        // After OAuth redirect, persist the setting
        const res = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calendar_enabled: true }),
        });
        if (res.ok) {
          const { settings: updated } = await res.json();
          onUpdate(updated);
        }
      } else {
        // Disabling: update setting then notify parent
        const res = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calendar_enabled: false }),
        });
        if (res.ok) {
          const { settings: updated } = await res.json();
          onUpdate(updated);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
        <div>
          <p className="font-medium text-gray-900">Calendar Integration</p>
          <p className="text-sm text-gray-500">
            Sync tasks with Google Calendar
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.calendar_enabled}
          disabled={loading}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
            settings.calendar_enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.calendar_enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
