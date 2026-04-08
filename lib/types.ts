export type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  quadrant: Quadrant;
  deadline?: string;           // ISO 8601
  urgency_threshold_days?: number;
  escalated: boolean;
  pre_escalation_quadrant?: Quadrant;
  calendar_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CompletedTask {
  id: string;
  user_id: string;
  title: string;
  original_quadrant: Quadrant;
  deadline?: string;
  completion_timestamp: string;
  calendar_event_id?: string;
}

export interface UserProfile {
  id: string;
  calendar_enabled: boolean;
}
