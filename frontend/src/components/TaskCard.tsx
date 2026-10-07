'use client';

import { Task } from '@/lib/api';
import { Calendar, User, CheckCircle2, Clock, Trash2, Edit3, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onOpenDetail: (task: Task) => void;
}

export default function TaskCard({ task, onStatusChange, onEdit, onDelete, onOpenDetail }: TaskCardProps) {
  const isCompleted = task.status === 'completed';
  const isOverdue = task.due_date && !isCompleted && new Date(task.due_date).getTime() < Date.now();

  const priorityColors = {
    high: 'bg-rose-100 text-rose-700 border-rose-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const statusBadges = {
    todo: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${isCompleted ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200'}`}>
      
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${priorityColors[task.priority]}`}>
              {task.priority} Priority
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${statusBadges[task.status]}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit Task"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Title & Description */}
        <h3
          onClick={() => onOpenDetail(task)}
          className={`font-bold text-slate-900 text-base cursor-pointer hover:text-indigo-600 transition-colors line-clamp-1 mb-1 ${isCompleted ? 'line-through text-slate-400' : ''}`}
        >
          {task.title}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {task.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        
        {/* Assignee & Creator */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Assigned to:</span>
            {task.assignee ? (
              <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-full">
                <img
                  src={task.assignee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee.email}`}
                  alt={task.assignee.full_name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[100px]">
                  {task.assignee.full_name || task.assignee.email}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic text-[11px]">Unassigned</span>
            )}
          </div>

          <button
            onClick={() => onOpenDetail(task)}
            className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 text-xs font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussion</span>
          </button>
        </div>

        {/* Status Toggle & Due Date */}
        <div className="flex items-center justify-between pt-1">
          {task.due_date ? (
            <div className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
              {isOverdue && <span className="bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded text-[9px] uppercase font-extrabold ml-1">Overdue</span>}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">No due date</div>
          )}

          <div className="flex items-center gap-1">
            {task.status !== 'completed' ? (
              <button
                onClick={() => onStatusChange(task.id, 'completed')}
                className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Done</span>
              </button>
            ) : (
              <button
                onClick={() => onStatusChange(task.id, 'todo')}
                className="flex items-center gap-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Reopen</span>
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
