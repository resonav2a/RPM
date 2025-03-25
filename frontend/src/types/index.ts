// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 'p0' | 'p1' | 'p2' | 'p3';
  due_date?: string;
  created_at: string;
  updated_at: string;
  creator_id: string;
  assignee_id?: string;
  tags?: string[];
  campaign_id?: string;
}

// Document types
export interface Document {
  id: string;
  title: string;
  content: string;
  author_id: string;
  visibility: 'public' | 'private' | 'shared';
  last_updated: string;
}

// Campaign types
export interface Campaign {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  color?: string;
  blast_mode?: boolean;
  channels?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Template types
export interface TaskTemplate {
  title: string;
  description?: string;
  assignee_role?: string;
  due_date_offset?: number; // Days from creation
  priority?: 'p0' | 'p1' | 'p2' | 'p3';
  tags?: string[];
}

export interface Template {
  id: string;
  name: string;
  tasks: TaskTemplate[];
}

// User types
export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'user';
}