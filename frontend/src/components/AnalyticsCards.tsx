'use client';

import { TaskAnalytics } from '@/lib/api';
import { Layers, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface AnalyticsCardsProps {
  stats: TaskAnalytics;
}

export default function AnalyticsCards({ stats }: AnalyticsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      
      {/* Total Tasks */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</h3>
        </div>
        <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
          <Layers className="w-6 h-6" />
        </div>
      </div>

      {/* Todo / Pending */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
          <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{stats.pending}</h3>
        </div>
        <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      {/* In Progress */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</p>
          <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{stats.in_progress}</h3>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
          <AlertCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Completed */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.completed}</h3>
        </div>
        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>

    </div>
  );
}
