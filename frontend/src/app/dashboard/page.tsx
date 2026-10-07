'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { api, Task, UserProfile, TaskAnalytics } from '@/lib/api';
import Navbar from '@/components/Navbar';
import AnalyticsCards from '@/components/AnalyticsCards';
import TaskCard from '@/components/TaskCard';
import CreateTaskModal from '@/components/CreateTaskModal';
import EditTaskModal from '@/components/EditTaskModal';
import TaskDetailModal from '@/components/TaskDetailModal';
import { Search, Filter, RefreshCw, CheckCircle2, UserCheck, Layers } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analytics, setAnalytics] = useState<TaskAnalytics>({ total: 0, completed: 0, in_progress: 0, todo: 0, pending: 0 });

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'all' | 'assigned_to_me' | 'created_by_me' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initSession();
  }, []);

  const initSession = async () => {
    let userProfile: UserProfile | null = null;
    
    // Check Supabase OAuth session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      userProfile = {
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
        avatar_url: session.user.user_metadata?.avatar_url || '',
      };
    } else {
      // Check demo user in localStorage
      const demoStr = localStorage.getItem('demo_user');
      if (demoStr) {
        userProfile = JSON.parse(demoStr);
      }
    }

    if (!userProfile) {
      router.push('/login');
      return;
    }

    setCurrentUser(userProfile);
    await api.syncProfile(userProfile);
    await loadData(userProfile);
    setLoading(false);
  };

  const loadData = async (user: UserProfile) => {
    const [fetchedUsers, fetchedTasks, fetchedAnalytics] = await Promise.all([
      api.getUsers(),
      api.getTasks(),
      api.getAnalytics(),
    ]);
    setUsers(fetchedUsers);
    setTasks(fetchedTasks);
    setAnalytics(fetchedAnalytics);
  };

  const handleRefresh = async () => {
    if (currentUser) {
      setLoading(true);
      await loadData(currentUser);
      setLoading(false);
    }
  };

  // Handlers for Task Operations
  const handleCreateTask = async (taskData: any) => {
    if (!currentUser) return;
    const res = await api.createTask({
      ...taskData,
      created_by: currentUser.id,
    });
    if (res.success || res.task) {
      await loadData(currentUser);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!currentUser) return;
    const res = await api.updateTask(taskId, {
      ...updates,
      updated_by: currentUser.id,
    });
    if (res.success) {
      await loadData(currentUser);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    await handleUpdateTask(taskId, { status: newStatus });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    if (!currentUser) return;
    await api.deleteTask(taskId);
    await loadData(currentUser);
  };

  // Filter Tasks Client-side
  const filteredTasks = tasks.filter((t) => {
    // Search query filter
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Priority filter
    if (priorityFilter && t.priority !== priorityFilter) {
      return false;
    }
    // Tab filters
    if (activeTab === 'assigned_to_me') {
      return t.assigned_to === currentUser?.id;
    }
    if (activeTab === 'created_by_me') {
      return t.created_by === currentUser?.id;
    }
    if (activeTab === 'completed') {
      return t.status === 'completed';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} onOpenCreateModal={() => setIsCreateOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Metric Overview Cards */}
        <AnalyticsCards stats={analytics} />

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Tasks</span>
            </button>
            <button
              onClick={() => setActiveTab('assigned_to_me')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'assigned_to_me' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assigned to Me</span>
            </button>
            <button
              onClick={() => setActiveTab('created_by_me')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'created_by_me' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <span>Created by Me</span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'completed' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </button>
          </div>

          {/* Search & Priority Select */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1.5 px-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700"
            >
              <option value="">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <button
              onClick={handleRefresh}
              title="Refresh Tasks"
              className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>

        {/* Task Grid / Empty State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium">Fetching tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Tasks Found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {searchQuery || priorityFilter
                ? 'No tasks matched your search or priority criteria.'
                : 'Get started by creating your first task!'}
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200"
            >
              Create New Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={(t) => setEditingTask(t)}
                onDelete={handleDeleteTask}
                onOpenDetail={(t) => setDetailTask(t)}
              />
            ))}
          </div>
        )}

      </main>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        users={users}
        currentUser={currentUser}
        onSubmit={handleCreateTask}
      />

      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        users={users}
        onSubmit={handleUpdateTask}
      />

      <TaskDetailModal
        task={detailTask}
        isOpen={!!detailTask}
        onClose={() => setDetailTask(null)}
        currentUser={currentUser}
      />

    </div>
  );
}
