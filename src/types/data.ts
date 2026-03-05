export type TaskType = 'task' | 'routine_class' | 'workout';

export type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'sports';
export type WorkoutIntensity = 'low' | 'medium' | 'high';

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  order: number;
  created_at?: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'completed';
  category: string;
  location?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  estimated_duration_minutes?: number | null;
  created_at?: string;
  
  // Extension Fields
  task_type?: TaskType;
  workout_type?: WorkoutType | null;
  target_muscle_group?: string | null;
  intensity?: WorkoutIntensity | null;

  // Relational client-side joins
  subtasks?: Subtask[];
}
