'use client';
import { TaskAnalytics } from '@/lib/api';
import { Layers, Clock, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
interface AnalyticsCardsProps { stats: TaskAnalytics; }
export default function AnalyticsCards({ stats }: AnalyticsCardsProps) {
  const cards=[
    ['Total Tasks',stats.total,'text-slate-900','bg-slate-100',Layers],
    ['Pending',stats.pending,'text-amber-600','bg-amber-50',Clock],
    ['In Progress',stats.in_progress,'text-blue-600','bg-blue-50',AlertCircle],
    ['Completed',stats.completed,'text-emerald-600','bg-emerald-50',CheckCircle],
    ['Overdue',stats.overdue,'text-rose-600','bg-rose-50',AlertTriangle],
  ] as const;
  return <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">{cards.map(([label,value,textColor,bgColor,Icon])=><div key={label} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p><h3 className={'text-2xl font-extrabold mt-1 '+textColor}>{value}</h3></div><div className={'p-3 rounded-xl '+bgColor+' '+textColor}><Icon className="w-6 h-6" /></div></div>)}</div>;
}
