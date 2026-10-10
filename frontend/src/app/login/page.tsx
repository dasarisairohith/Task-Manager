'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { api } from '@/lib/api';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const syncAndRedirect = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (!session || !active) return;

      try {
        await api.syncProfile({
          id: session.user.id,
          email: session.user.email || '',
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split('@')[0] ||
            'User',
          avatar_url:
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            '',
        });
      } catch (error) {
        console.error('Profile sync failed:', error);
      }

      if (active) router.replace('/dashboard');
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncAndRedirect(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void syncAndRedirect(session);
    });

    return () => {
      active = false;
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
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Google OAuth error:', error);
      alert(
        'Google sign-in could not start. Check that Google is enabled in Supabase Authentication and that this site URL is in the allowed redirect URLs.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Task Manager</h1>
          <p className="text-sm text-slate-500">
            Collaborative task management with Gmail notifications &amp; Supabase
          </p>
        </div>

        <div className="bg-indigo-50/60 rounded-xl p-4 space-y-2 border border-indigo-100/60">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            Google OAuth 2.0 authentication
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            Assign tasks to collaborators seamlessly
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            Automated Gmail task notifications
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>{loading ? 'Connecting to Google…' : 'Continue with Google'}</span>
          </button>
          <p className="text-center text-xs leading-5 text-slate-500">
            New to Task Manager? Your account is created automatically the first time you continue with Google.
            Existing users can use the same button to sign in with their Gmail/Google account.
          </p>
        </div>

        <p className="text-center text-xs text-slate-400">
          Powered by Supabase Authentication, PostgreSQL, Flask REST API &amp; Next.js
        </p>
      </div>
    </div>
  );
}
