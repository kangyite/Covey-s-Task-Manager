'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Task, Quadrant } from '@/lib/types';
import MatrixBoard from '@/components/MatrixBoard';
import TaskFormModal, { TaskFormData } from '@/components/TaskFormModal';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
}

let toastCounter = 0;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MatrixSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 h-full" aria-busy="true" aria-label="Loading tasks">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 animate-pulse">
          <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-36 bg-gray-100 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MatrixPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const hasFetched = useRef(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [defaultQuadrant, setDefaultQuadrant] = useState<Quadrant | undefined>(undefined);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function showError(message: string) {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Escalation ───────────────────────────────────────────────────────────

  const runEscalation = useCallback(async (currentTasks: Task[]) => {
    try {
      const res = await fetch('/api/escalation', { method: 'POST' });
      if (!res.ok) return;
      const data: { escalated: string[] } = await res.json();
      if (data.escalated.length === 0) return;

      // Re-fetch tasks to get updated quadrants for escalated tasks
      const tasksRes = await fetch('/api/tasks');
      if (!tasksRes.ok) return;
      const tasksData: { tasks: Task[] } = await tasksRes.json();
      setTasks(tasksData.tasks);
    } catch {
      // Escalation errors are silent — don't disrupt the user
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Don't show skeleton on re-visits if we already have tasks
      if (!hasFetched.current) {
        setLoading(true);
      }
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) {
          showError('Failed to load tasks. Please refresh the page.');
          setLoading(false);
          return;
        }
        const data: { tasks: Task[] } = await res.json();
        if (!cancelled) {
          setTasks(data.tasks);
          setLoading(false);
          hasFetched.current = true;
          runEscalation(data.tasks);
        }
      } catch {
        if (!cancelled) {
          showError('Failed to load tasks. Please refresh the page.');
          setLoading(false);
        }
      }
    }

    init();

    // Poll escalation every 60 seconds
    intervalRef.current = setInterval(() => {
      runEscalation([]);
    }, 60_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runEscalation]);

  // ── Drag-and-drop (optimistic) ────────────────────────────────────────────

  async function handleTaskMove(taskId: string, newQuadrant: Quadrant) {
    const previous = tasks;
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, quadrant: newQuadrant } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quadrant: newQuadrant }),
      });
      if (!res.ok) throw new Error('Move failed');
    } catch {
      setTasks(previous);
      showError('Failed to move task. Please try again.');
    }
  }

  // ── Complete (optimistic) ─────────────────────────────────────────────────

  async function handleTaskComplete(taskId: string) {
    const previous = tasks;
    // Optimistic removal
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' });
      if (!res.ok) throw new Error('Complete failed');
    } catch {
      setTasks(previous);
      showError('Failed to complete task. Please try again.');
    }
  }

  // ── Delete (optimistic) ───────────────────────────────────────────────────

  async function handleTaskDelete(taskId: string) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch {
      setTasks(previous);
      showError('Failed to delete task. Please try again.');
    }
  }

  // ── Task click → open edit modal ──────────────────────────────────────────

  function handleTaskClick(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  // ── New task button ───────────────────────────────────────────────────────

  function handleNewTask() {
    setEditingTask(undefined);
    setDefaultQuadrant(undefined);
    setModalOpen(true);
  }

  // ── Add task from quadrant ────────────────────────────────────────────────

  function handleAddTaskInQuadrant(quadrant: Quadrant) {
    setEditingTask(undefined);
    setDefaultQuadrant(quadrant);
    setModalOpen(true);
  }

  // ── Modal submit ──────────────────────────────────────────────────────────

  async function handleModalSubmit(data: TaskFormData) {
    if (editingTask) {
      // Edit existing task
      const previous = tasks;
      const optimistic: Task = { ...editingTask, ...data, updated_at: new Date().toISOString() };
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? optimistic : t)));

      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setTasks(previous);
        showError('Failed to update task. Please try again.');
        throw new Error('Update failed');
      }
      const result: { task: Task } = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? result.task : t)));
    } else {
      // Create new task
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        showError('Failed to create task. Please try again.');
        throw new Error('Create failed');
      }
      const result: { task: Task } = await res.json();
      setTasks((prev) => [...prev, result.task]);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Task Matrix</h1>
        <button
          onClick={handleNewTask}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 min-h-[44px] min-w-[44px]"
        >
          <span aria-hidden="true">+</span>
          New Task
        </button>
      </header>

      {/* Matrix */}
      <main className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
        {loading ? (
          <MatrixSkeleton />
        ) : (
          <MatrixBoard
            tasks={tasks}
            onTaskMove={handleTaskMove}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            onAddTask={handleAddTaskInQuadrant}
            className="flex-1 h-full"
          />
        )}
      </main>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div
          aria-live="assertive"
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="alert"
              className="flex items-center gap-3 bg-red-600 text-white text-sm px-4 py-3 rounded-lg shadow-lg max-w-sm"
            >
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss"
                className="text-white/80 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Task form modal */}
      <TaskFormModal
        isOpen={modalOpen}
        task={editingTask}
        defaultQuadrant={defaultQuadrant}
        onSubmit={handleModalSubmit}
        onDelete={editingTask ? handleTaskDelete : undefined}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
