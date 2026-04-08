'use client';

import { useDroppable } from '@dnd-kit/core';
import { Quadrant, Task } from '@/lib/types';
import TaskCard from '@/components/TaskCard';

interface QuadrantPanelProps {
  quadrant: Quadrant;
  label: string;
  descriptor: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskComplete: (taskId: string) => void;
  onAddTask: (quadrant: Quadrant) => void;
}

export default function QuadrantPanel({
  quadrant,
  label,
  descriptor,
  tasks,
  onTaskClick,
  onTaskComplete,
  onAddTask,
}: QuadrantPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrant });

  const quadrantStyles: Record<Quadrant, string> = {
    Q1: 'border-red-400 bg-red-50',
    Q2: 'border-blue-400 bg-blue-50',
    Q3: 'border-yellow-400 bg-yellow-50',
    Q4: 'border-gray-400 bg-gray-50',
  };

  const headerStyles: Record<Quadrant, string> = {
    Q1: 'bg-red-100 text-red-800',
    Q2: 'bg-blue-100 text-blue-800',
    Q3: 'bg-yellow-100 text-yellow-800',
    Q4: 'bg-gray-100 text-gray-700',
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border-2 transition-colors min-h-[200px] ${quadrantStyles[quadrant]} ${
        isOver ? 'ring-2 ring-offset-2 ring-indigo-400' : ''
      }`}
    >
      <div className={`flex items-center justify-between rounded-t-md px-4 py-2 ${headerStyles[quadrant]}`}>
        <div>
          <h2 className="font-semibold text-sm">{label}</h2>
          <p className="text-xs opacity-75">{descriptor}</p>
        </div>
        <button
          type="button"
          onClick={() => onAddTask(quadrant)}
          aria-label={`Add task to ${label}`}
          className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md text-lg font-medium opacity-60 hover:opacity-100 hover:bg-black/10 transition-all"
        >
          +
        </button>
      </div>
      <div className="flex flex-col gap-2 p-3 flex-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onTaskClick={onTaskClick}
            onTaskComplete={onTaskComplete}
          />
        ))}
      </div>
    </div>
  );
}
