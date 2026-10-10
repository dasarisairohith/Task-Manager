import { supabase } from './supabaseClient';

// Use the local Flask API during development and the Render service in production.
// NEXT_PUBLIC_API_BASE_URL can override either value in the hosting environment.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://task-manager-backend.onrender.com/api'
    : 'http://localhost:5000/api');

export interface UserProfile { id:string; email:string; full_name:string; avatar_url?:string; }
export interface Task { id:string; title:string; description?:string; status:'todo'|'in_progress'|'completed'; priority:'low'|'medium'|'high'; due_date?:string; created_by:string; assigned_to?:string; creator?:UserProfile; assignee?:UserProfile; created_at:string; updated_at:string; }
export interface TaskComment { id:string; task_id:string; user_id:string; content:string; created_at:string; author?:UserProfile; }
export interface TaskAnalytics { total:number; completed:number; in_progress:number; todo:number; pending:number; overdue:number; }

async function request(path:string, options:RequestInit={}) {
  const { data:{ session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.');
  const headers = new Headers(options.headers);
  headers.set('Authorization', 'Bearer ' + session.access_token);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type','application/json');
  const res=await fetch(API_BASE_URL + path,{...options,headers});
  let data:any={}; try { data=await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || 'Request failed (' + res.status + ')');
  return data;
}

export const api = {
  syncProfile: async (user:{id:string;email:string;full_name?:string;avatar_url?:string}) => request('/auth/sync-profile',{method:'POST',body:JSON.stringify({full_name:user.full_name,avatar_url:user.avatar_url})}),
  getUsers: async ():Promise<UserProfile[]> => (await request('/users')).users || [],
  getTasks: async (filters:{status?:string;priority?:string;assigned_to?:string;created_by?:string;search?:string}={}):Promise<Task[]> => { const params=new URLSearchParams(); Object.entries(filters).forEach(([k,v])=>{if(v)params.set(k,v as string)}); return (await request('/tasks?' + params.toString())).tasks || []; },
  createTask: async (payload:{title:string;description?:string;assigned_to?:string;priority?:string;due_date?:string}) => request('/tasks',{method:'POST',body:JSON.stringify(payload)}),
  updateTask: async (taskId:string,payload:Partial<Task>) => request('/tasks/' + taskId,{method:'PUT',body:JSON.stringify(payload)}),
  deleteTask: async (taskId:string) => request('/tasks/' + taskId,{method:'DELETE'}),
  getComments: async (taskId:string):Promise<TaskComment[]> => (await request('/comments/' + taskId)).comments || [],
  addComment: async (taskId:string, _userId:string, content:string) => request('/comments/' + taskId,{method:'POST',body:JSON.stringify({content})}),
  getAnalytics: async ():Promise<TaskAnalytics> => (await request('/analytics')).stats || {total:0,completed:0,in_progress:0,todo:0,pending:0,overdue:0},
};