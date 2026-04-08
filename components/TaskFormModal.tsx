'use client';

import { useState, useEffect, FormEvent } from 'react';
import type { Task, Quadrant } from '@/lib/types';
import { validateTaskInput } from '@/lib/validation';

export interface TaskFormData {
  title: string;
  description?: string;
  quadrant: Quadrant;
  deadline?: string;
  urgency_threshold_days?: number;
}

interface TaskFormModalProps {
  task?: Task;
  defaultQuadrant?: Quadrant;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: (taskId: string) => Promise<void>;
  isOpen: boolean;
}

const QUADRANT_OPTIONS: { value: Quadrant; label: string }[] = [
  { value: 'Q1', label: 'Q1 - Do First' },
  { value: 'Q2', label: 'Q2 - Schedule' },
  { value: 'Q3', label: 'Q3 - Delegate' },
  { value: 'Q4', label: 'Q4 - Eliminate' },
];

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return '';
  // datetime-local expects "YYYY-MM-DDTHH:MM"
  return iso.slice(0, 16);
}

export default function TaskFormModal({ task, defaultQuadrant, onSubmit, onClose, onDelete, isOpen }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quadrant, setQuadrant] = useState<Quadrant>('Q1');
  const [deadline, setDeadline] = useState('');
  const [urgencyThresholdDays, setUrgencyThresholdDays] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-populate fields when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setQuadrant(task.quadrant);
      setDeadline(toDatetimeLocalValue(task.deadline));
      setUrgencyThresholdDays(task.urgency_threshold_days?.toString() ?? '');
    } else {
      setTitle('');
      setDescription('');
      setQuadrant(defaultQuadrant ?? 'Q1');
      setDeadline('');
      setUrgencyThresholdDays('');
    }
    setErrors({});
  }, [task, isOpen]);

  // When deadline is cleared, also clear urgency threshold
  function handleDeadlineChange(value: string) {
    setDeadline(value);
    if (!value) {
      setUrgencyThresholdDays('');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const data: Record<string, unknown> = {
      title,
      quadrant,
    };
    if (description) data.description = description;
    if (deadline) data.deadline = new Date(deadline).toISOString();
    if (urgencyThresholdDays) data.urgency_threshold_days = parseInt(urgencyThresholdDays, 10);

    const result = validateTaskInput(data);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const formData: TaskFormData = {
        title,
        quadrant,
      };
      if (description) formData.description = description;
      if (deadline) formData.deadline = new Date(deadline).toISOString();
      if (urgencyThresholdDays) formData.urgency_threshold_days = parseInt(urgencyThresholdDays, 10);

      await onSubmit(formData);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
    >
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl p-6">
        <h2 id="task-form-title" className="text-xl font-semibold text-gray-900 mb-5">
          {task ? 'Edit Task' : 'New Task'}
        </h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              required
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.description ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Quadrant */}
          <div>
            <label htmlFor="task-quadrant" className="block text-sm font-medium text-gray-700 mb-1">
              Quadrant <span className="text-red-500">*</span>
            </label>
            <select
              id="task-quadrant"
              value={quadrant}
              onChange={(e) => setQuadrant(e.target.value as Quadrant)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.quadrant ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              {QUADRANT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.quadrant && (
              <p className="mt-1 text-xs text-red-600">{errors.quadrant}</p>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="task-deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <input
              id="task-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => handleDeadlineChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Urgency Threshold */}
          <div>
            <label
              htmlFor="task-urgency"
              className={`block text-sm font-medium mb-1 ${deadline ? 'text-gray-700' : 'text-gray-400'}`}
            >
              Urgency Threshold (days before deadline)
            </label>
            <input
              id="task-urgency"
              type="number"
              min={1}
              value={urgencyThresholdDays}
              onChange={(e) => setUrgencyThresholdDays(e.target.value)}
              disabled={!deadline}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.urgency_threshold_days ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.urgency_threshold_days && (
              <p className="mt-1 text-xs text-red-600">{errors.urgency_threshold_days}</p>
            )}
          </div>

          {/* Form-level error */}
          {errors._form && (
            <p className="text-xs text-red-600">{errors._form}</p>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-2">
            {task && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await onDelete(task.id);
                    onClose();
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 min-h-[44px] min-w-[44px]"
              >
                Delete
              </button>
            )}
            <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 min-h-[44px] min-w-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 min-h-[44px] min-w-[44px]"
            >
              {submitting && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              )}
              {submitting ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
