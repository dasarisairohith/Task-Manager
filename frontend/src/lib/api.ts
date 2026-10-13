import { supabase } from './supabaseClient';

const API_BASE_URL = process.env.NEXT_PUXX_API_BASE_URL || 'https://task-manager-blush-seven-93.vercel.app/api';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  created_by?: string;
  assigned_to?: string | null;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
  assignee?: UserProfile | null;
  creator?: UserProfile | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: UserProfile | null;
}

export interface TaskAnalytics {
  total: number;
  completed: number;
  in_progress: number;
  todo: number;
  pending: number;
  overdue: number;
}

async function getAccessToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session.access_token ?? null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  async syncProfile(profile: UserProfile) {
    return request<{ success: boolean; profile: UserProfile }>('/auth/sync-profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  async getUsers() {
    const data = await request<{ users: UserProfile[] }>('/users');
    return data.users;
  },

  async getTasks() {
    const data = await request<{ tasks: Task[] }>('/tasks');
    return data.tasks;
  },

  async getAnalytics() {
    const data = await request<{ stats: TaskAnalytics }>('/analytics');
    return data.stats;
  },

  async createTask(taskData: {
    title: string;
    description?: string;
    assigned_to?: string;
    priority?: string;
    due_date?: string;
  }) {
    return request<{ success: boolean; task?: Task; error?: string }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  async updateTask(taskId: string, updates: Partial<Task>) {
    return request<{ success: boolean; task?: Task; error?: string }>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteTask(taskId: string) {
    return request<{ success: boolean; message?: string; error?: string }>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  async getComments(taskId: string) {
    const data = await request<{ comments: TaskComment[] }>(`/comments/${taskId}`);
    return data.comments;
  },

  async addComment(taskId: string, userId: string, content: string) {
    return request<{ success: boolean; comment?: TaskComment; error?: string }>(`/comments/${taskId}`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, content }),
    });
  },
};
