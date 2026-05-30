import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { loginSchema } from '../utils/validation';
import { useAuthStore } from '../store/useAuthStore';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const isSubmitting = useRef(false);
  const setUser = useAuthStore(state => state.setUser);
  const setProfile = useAuthStore(state => state.setProfile);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    setLoading(true);
    setError(null);

    // Validate input
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // FORCE MANUAL UPDATE: Ensure store is updated immediately
      if (data.user) {
        setUser(data.user);
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
        if (profile) setProfile(profile);
      }
      
      navigate('/profile', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-neutral-900 p-8 shadow-xl border border-neutral-800"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-strawberry-600/10 text-strawberry-500">
            <LogIn size={32} />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Sign in to access your SMP dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-300">Email Address</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg bg-neutral-800 border border-neutral-700 py-2.5 pl-10 pr-3 text-white placeholder-neutral-500 focus:border-strawberry-500 focus:ring-1 focus:ring-strawberry-500 sm:text-sm transition-colors"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-300">Password</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg bg-neutral-800 border border-neutral-700 py-2.5 pl-10 pr-3 text-white placeholder-neutral-500 focus:border-strawberry-500 focus:ring-1 focus:ring-strawberry-500 sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-strawberry-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-strawberry-700 focus:outline-none focus:ring-2 focus:ring-strawberry-500 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Sign In'
              )}
            </button>
            <div className="text-center mt-4">
              <Link to="/forgot-password" className="text-sm text-neutral-400 hover:text-strawberry-500 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>
        </form>

        <p className="text-center text-sm text-neutral-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-strawberry-500 hover:text-strawberry-400 transition-colors">
            Sign up for free
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
