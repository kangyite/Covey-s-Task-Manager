'use client';

import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Quadrant, Task } from '@/lib/types';
import QuadrantPanel from '@/components/QuadrantPanel';

interface MatrixBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newQuadrant: Quadrant) => void;
  onTaskClick: (task: Task) => void;
  onTaskComplete: (taskId: string) => void;
  onAddTask: (quadrant: Quadrant) => void;
  className?: string;
}


const QUADRANTS: { quadrant: Quadrant; label: string; descriptor: string }[] = [
  { quadrant: 'Q1', label: 'Do First', descriptor: 'Important + Urgent' },
  { quadrant: 'Q2', label: 'Schedule', descriptor: 'Important + Not Urgent' },
  { quadrant: 'Q3', label: 'Delegate', descriptor: 'Not Important + Urgent' },
  { quadrant: 'Q4', label: 'Eliminate', descriptor: 'Not Important + Not Urgent' },
];

export default function MatrixBoard({
  tasks,
  onTaskMove,
  onTaskClick,
  onTaskComplete,
  onAddTask,
  className = '',
}: MatrixBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newQuadrant = over.id as Quadrant;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.quadrant !== newQuadrant) {
      onTaskMove(taskId, newQuadrant);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 h-full ${className}`} style={{ gridAutoRows: '1fr' }}>
        {QUADRANTS.map(({ quadrant, label, descriptor }) => (
          <QuadrantPanel
            key={quadrant}
            quadrant={quadrant}
            label={label}
            descriptor={descriptor}
            tasks={tasks.filter((t) => t.quadrant === quadrant)}
            onTaskClick={onTaskClick}
            onTaskComplete={onTaskComplete}
            onAddTask={onAddTask}
          />
        ))}
      </div>
    </DndContext>
  );
}
