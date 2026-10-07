'use client';

import { useState, useEffect } from 'react';
import { Task, TaskComment, UserProfile, api } from '@/lib/api';
import { X, Send, MessageSquare, Calendar, User, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export default function TaskDetailModal({ task, isOpen, onClose, currentUser }: TaskDetailModalProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      loadComments(task.id);
    }
  }, [task, isOpen]);

  const loadComments = async (taskId: string) => {
    setLoadingComments(true);
    const data = await api.getComments(taskId);
    setComments(data);
    setLoadingComments(false);
  };

  if (!isOpen || !task) return null;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    setSubmitting(true);
    try {
      const res = await api.addComment(task.id, currentUser.id, newComment);
      if (res.success) {
        setNewComment('');
        await loadComments(task.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 pr-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase">
              {task.priority} Priority
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
              {task.status.replace('_', ' ')}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">{task.title}</h2>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pr-2 space-y-6">
          
          {/* Description */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</h4>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Task Info Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">Assigned To:</span>
              <span className="font-semibold text-slate-800">
                {task.assignee ? task.assignee.full_name || task.assignee.email : 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Created By:</span>
              <span className="font-semibold text-slate-800">
                {task.creator ? task.creator.full_name || task.creator.email : 'System'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Due Date:</span>
              <span className="font-semibold text-slate-800">
                {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No limit'}
              </span>
            </div>
          </div>

          {/* Comments Feed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Task Activity & Comments</h3>
            </div>

            {loadingComments ? (
              <p className="text-xs text-slate-400 italic py-2">Loading discussion thread...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 bg-slate-50 rounded-xl text-center">
                No comments yet. Start the conversation below!
              </p>
            ) : (
              <div className="space-y-3 mb-4">
                {comments.map((c) => (
                  <div key={c.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">
                        {c.author?.full_name || c.author?.email || 'Collaborator'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(c.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-normal">{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment or update..."
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>Post</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
