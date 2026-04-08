'use client';

import { useState } from 'react';
import { CompletedTask, Quadrant } from '@/lib/types';

const PAGE_SIZE = 10;

const QUADRANT_LABELS: Record<Quadrant, string> = {
  Q1: 'Q1 - Do First',
  Q2: 'Q2 - Schedule',
  Q3: 'Q3 - Delegate',
  Q4: 'Q4 - Eliminate',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface HistoryListProps {
  completedTasks: CompletedTask[];
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export default function HistoryList({ completedTasks, onDelete, onRestore }: HistoryListProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(completedTasks.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const paginated = completedTasks.slice(start, start + PAGE_SIZE);

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Title</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Quadrant</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Completed</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Deadline</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No completed tasks yet.
                </td>
              </tr>
            ) : (
              paginated.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 font-medium">{task.title}</td>
                  <td className="px-4 py-3 text-gray-600">{QUADRANT_LABELS[task.original_quadrant]}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDateTime(task.completion_timestamp)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {task.deadline ? formatDate(task.deadline) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRestore(task.id)}
                        aria-label={`Restore task: ${task.title}`}
                        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-md bg-green-50 px-3 text-green-700 hover:bg-green-100 active:bg-green-200 transition-colors font-medium"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => onDelete(task.id)}
                        aria-label={`Delete completed task: ${task.title}`}
                        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-md bg-red-50 px-3 text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({completedTasks.length} tasks)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
