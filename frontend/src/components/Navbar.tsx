'use client';

import { UserProfile } from '@/lib/api';
import { SIGNED_IN_TAB_KEY, supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, CheckSquare, Sparkles } from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  onOpenCreateModal: () => void;
}

export default function Navbar({ user, onOpenCreateModal }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    localStorage.removeItem('demo_user');
    sessionStorage.removeItem(SIGNED_IN_TAB_KEY);
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">TaskFlow</span>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 uppercase">
                  Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Supabase & Flask Task Management</p>
            </div>
          </div>

          {/* User Controls & Create Task Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>

            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt={user.full_name || 'User'}
                  className="w-9 h-9 rounded-full border-2 border-indigo-100 object-cover shadow-xs"
                />
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{user.full_name || 'User'}</div>
                  <div className="text-[11px] text-slate-400 leading-tight">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
