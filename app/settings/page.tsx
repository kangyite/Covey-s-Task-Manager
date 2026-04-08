'use client';

import { useEffect, useState } from 'react';
import SettingsForm from '@/components/SettingsForm';
import type { UserProfile } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
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
  }, []);

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
