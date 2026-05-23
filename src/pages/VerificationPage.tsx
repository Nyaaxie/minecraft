import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const VerificationPage = () => {
  const { user, loading } = useAuthStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const handleAuthStatus = async () => {
      // If auth is still loading, stay in verifying state
      if (loading) return;

      // Once loading finishes, check if we have a user
      if (user) {
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setStatus('error');
      }
    };
    handleAuthStatus();
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-950">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-neutral-900 p-8 shadow-xl border border-neutral-800 text-center"
      >
        {status === 'verifying' && (
          <div className="space-y-4">
            <Loader2 className="animate-spin text-strawberry-600 mx-auto" size={48} />
            <h2 className="text-2xl font-bold">Verifying Account...</h2>
            <p className="text-neutral-400">Please wait while we confirm your email.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="text-green-500 mx-auto" size={48} />
            <h2 className="text-2xl font-bold">Account Verified!</h2>
            <p className="text-neutral-400">Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="text-red-500 mx-auto" size={48} />
            <h2 className="text-2xl font-bold">Verification Failed</h2>
            <p className="text-neutral-400">We couldn't verify your account. Please try logging in or requesting a new confirmation email.</p>
            <button 
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2 bg-strawberry-600 text-white rounded-xl hover:bg-strawberry-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerificationPage;
