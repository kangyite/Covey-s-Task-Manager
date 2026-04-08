import { Task, Quadrant } from './types';

/**
 * Computes the escalation time for a task.
 * escalation_time = deadline - thresholdDays * 86400 seconds
 */
export function computeEscalationTime(deadline: string, thresholdDays: number): Date {
  const deadlineMs = new Date(deadline).getTime();
  return new Date(deadlineMs - thresholdDays * 86400 * 1000);
}

/**
 * Returns true when the task is eligible for escalation:
 * - task.escalated === false
 * - task.quadrant is 'Q2' or 'Q4'
 * - task.deadline and task.urgency_threshold_days are both set
 * - now >= computeEscalationTime(task.deadline, task.urgency_threshold_days)
 */
export function isEligibleForEscalation(task: Task, now: Date): boolean {
  if (task.escalated) return false;
  if (task.quadrant !== 'Q2' && task.quadrant !== 'Q4') return false;
  if (!task.deadline || task.urgency_threshold_days == null) return false;

  const escalationTime = computeEscalationTime(task.deadline, task.urgency_threshold_days);
  return now >= escalationTime;
}

const ESCALATION_MAP: Partial<Record<Quadrant, Quadrant>> = {
  Q2: 'Q1',
  Q4: 'Q3',
};

/**
 * Applies escalation to a list of tasks.
 * Returns a new array — originals are not mutated.
 */
export function applyEscalation(tasks: Task[]): Task[] {
  const now = new Date();
  return tasks.map((task) => {
    if (!isEligibleForEscalation(task, now)) return task;

    const newQuadrant = ESCALATION_MAP[task.quadrant]!;
    return {
      ...task,
      pre_escalation_quadrant: task.quadrant,
      quadrant: newQuadrant,
      escalated: true,
    };
  });
}
