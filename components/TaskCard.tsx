'use client';

import { useDraggable } from '@dnd-kit/core';
import { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onTaskClick: (task: Task) => void;
  onTaskComplete: (taskId: string) => void;
}

export default function TaskCard({ task, onTaskClick, onTaskComplete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  const formattedDeadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-start justify-between gap-2 rounded-md border bg-white px-3 py-2 shadow-sm cursor-grab transition-all ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-indigo-400' : 'hover:shadow-md'
      }`}
    >
      {/* Card body — clicking opens edit modal */}
      <button
        type="button"
        className="flex flex-col items-start flex-1 min-w-0 text-left min-h-[44px] justify-center"
        onClick={() => onTaskClick(task)}
      >
        <span className="text-sm font-medium text-gray-800 truncate w-full">{task.title}</span>
        {formattedDeadline && (
          <span className="text-xs text-gray-500 mt-0.5">{formattedDeadline}</span>
        )}
      </button>

      {/* Complete button — min 44×44px touch target */}
      <button
        type="button"
        aria-label={`Mark "${task.title}" as complete`}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onTaskComplete(task.id);
        }}
      >
        {/* Checkmark icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
