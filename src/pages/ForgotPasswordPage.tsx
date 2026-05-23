import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { z } from 'zod';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple Zod validation
    const emailSchema = z.string().email('Invalid email address');
    const validation = emailSchema.safeParse(email);
    
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSubmitted(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
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
          <h2 className="text-3xl font-bold tracking-tight">Forgot Password</h2>
          <p className="mt-2 text-sm text-neutral-400">
            {submitted 
              ? "Check your email for instructions to reset your password." 
              : "Enter your email address and we'll send you a link to reset your password."
            }
          </p>
        </div>

        {!submitted && (
          <form className="mt-8 space-y-6" onSubmit={handleReset}>
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-strawberry-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-strawberry-700 focus:outline-none focus:ring-2 focus:ring-strawberry-500 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
