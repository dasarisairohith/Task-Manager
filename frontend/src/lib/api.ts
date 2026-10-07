const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_by: string;
  assigned_to?: string;
  creator?: UserProfile;
  assignee?: UserProfile;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: UserProfile;
}

export interface TaskAnalytics {
  total: number;
  completed: number;
  in_progress: number;
  todo: number;
  pending: number;
}

export const api = {
  // Sync Google user profile with Flask backend / Supabase DB
  syncProfile: async (user: { id: string; email: string; full_name?: string; avatar_url?: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/sync-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to sync profile:', err);
      return null;
    }
  },

  // Fetch all registered users for task assignee selector
  getUsers: async (): Promise<UserProfile[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      const data = await res.json();
      return data.users || [];
    } catch (err) {
      console.error('Failed to fetch users:', err);
      return [];
    }
  },

  // Fetch tasks with filter parameters
  getTasks: async (filters: { status?: string; priority?: string; assigned_to?: string; created_by?: string; search?: string } = {}): Promise<Task[]> => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
      if (filters.created_by) params.append('created_by', filters.created_by);
      if (filters.search) params.append('search', filters.search);

      const res = await fetch(`${API_BASE_URL}/tasks?${params.toString()}`);
      const data = await res.json();
      return data.tasks || [];
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      return [];
    }
  },

  // Create new task (triggers Gmail SMTP notification if assigned)
  createTask: async (payload: { title: string; description?: string; created_by: string; assigned_to?: string; priority?: string; due_date?: string }) => {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  // Update task (triggers Gmail SMTP completion email if status becomes completed)
  updateTask: async (taskId: string, payload: Partial<Task> & { updated_by?: string }) => {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  // Delete task
  deleteTask: async (taskId: string) => {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  // Fetch task comments
  getComments: async (taskId: string): Promise<TaskComment[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/comments/${taskId}`);
      const data = await res.json();
      return data.comments || [];
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      return [];
    }
  },

  // Add comment
  addComment: async (taskId: string, user_id: string, content: string) => {
    const res = await fetch(`${API_BASE_URL}/comments/${taskId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, content }),
    });
    return await res.json();
  },

  // Fetch dashboard analytics
  getAnalytics: async (): Promise<TaskAnalytics> => {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics`);
      const data = await res.json();
      return data.stats || { total: 0, completed: 0, in_progress: 0, todo: 0, pending: 0 };
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      return { total: 0, completed: 0, in_progress: 0, todo: 0, pending: 0 };
    }
  }
};
