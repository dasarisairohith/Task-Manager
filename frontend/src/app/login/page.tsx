'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { api } from '@/lib/api';
import { CheckCircle2, ShieldCheck, Mail, Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [demoEmail, setDemoEmail] = useState('john.doe@gmail.com');
  const [demoName, setDemoName] = useState('John Doe');
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Sync profile to Flask backend
        api.syncProfile({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url || '',
        });
        router.push('/dashboard');
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await api.syncProfile({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url || '',
        });
        router.push('/dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google OAuth Error:', err.message);
      alert('Google Sign-In failed. Please verify the Supabase Google provider and OAuth redirect configuration.');
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEnabled) return;
    setLoading(true);
    try {
      const demoUser = { id: 'demo-user-123', email: demoEmail, full_name: demoName, avatar_url: '' };
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      throw new Error('Demo login is disabled for the deployment build. Use Google Sign-In.');
    } catch (err: any) {
      localStorage.removeItem('demo_user');
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-8 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Task Manager</h1>
          <p className="text-sm text-slate-500">
            Collaborative task management with Gmail notifications & Supabase
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="bg-indigo-50/60 rounded-xl p-4 space-y-2 border border-indigo-100/60">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Google OAuth 2.0 Identity Authentication
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Assign tasks to collaborators seamlessly
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Automated Gmail SMTP Email Dispatch
          </div>
        </div>

        {/* Google OAuth Login Button */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google OAuth</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider absolute">
            or Quick Demo Sign-In
          </span>
        </div>

        {demoEnabled && (/* Demo User Form */)
        <form onSubmit={handleDemoSignIn} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Gmail / User Email</label>
            <div className="relative">
              <input
                type="email"
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="name@gmail.com"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
            <input
              type="text"
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Full Name"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-200 transition-all text-sm"
          >
            <span>Enter Dashboard as Demo User</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>)}

        <p className="text-center text-xs text-slate-400">
          Powered by Supabase PostgreSQL, Flask REST API & Next.js 14
        </p>
      </div>
    </div>
  );
}
