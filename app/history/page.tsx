'use client';

import { useEffect, useState } from 'react';
import HistoryList from '@/components/HistoryList';
import { CompletedTask } from '@/lib/types';

export default function HistoryPage() {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/completed-tasks')
      .then((res) => res.json())
      .then((data) => {
        setCompletedTasks(data.completed_tasks ?? []);
      })
      .catch(() => {
        setErrors((prev) => [...prev, 'Failed to load completed tasks.']);
      })
      .finally(() => setLoading(false));
  }, []);

  function dismissError(index: number) {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleRestore(id: string) {
    const previous = completedTasks;
    setCompletedTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/completed-tasks/${id}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error('Restore failed');
    } catch {
      setCompletedTasks(previous);
      setErrors((prev) => [...prev, 'Failed to restore task. Please try again.']);
    }
  }

  async function handleDelete(id: string) {
    // Optimistic removal
    const previous = completedTasks;
    setCompletedTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/completed-tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Delete failed');
      }
    } catch {
      // Rollback
      setCompletedTasks(previous);
      setErrors((prev) => [...prev, 'Failed to delete completed task. Please try again.']);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Completed Tasks</h1>

        {/* Toast-style error messages */}
        {errors.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {errors.map((msg, i) => (
              <div
                key={i}
                role="alert"
                className="flex items-center justify-between rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
              >
                <span>{msg}</span>
                <button
                  onClick={() => dismissError(i)}
                  aria-label="Dismiss error"
                  className="ml-4 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded text-red-500 hover:text-red-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16" aria-label="Loading completed tasks">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          </div>
        ) : (
          <HistoryList completedTasks={completedTasks} onDelete={handleDelete} onRestore={handleRestore} />
        )}
      </div>
    </main>
  );
}
