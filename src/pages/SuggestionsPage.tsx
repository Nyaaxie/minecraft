import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkle, ArrowLeft, Loader2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dbService } from '../services/dbService';
import { useAuthStore } from '../store/useAuthStore';

const SuggestionsPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast.error('You must be logged in to submit a suggestion.');
        return;
    }
    setIsSubmitting(true);
    
    try {
        await dbService.createSuggestion({ user_id: user.id, title, description });
        toast.success('Suggestion submitted successfully! Thank you for helping improve StrawberrySMP.');
        setTitle('');
        setDescription('');
    } catch (err) {
        console.error(err);
        toast.error('Failed to submit suggestion.');
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <Link to="/server-info" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-strawberry-600 transition-colors group mb-8">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Server Info
      </Link>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20">
            <Sparkle className="text-strawberry-600" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">Suggestions</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 p-12 rounded-[3rem] border border-neutral-200 dark:border-white/5 shadow-sm space-y-8">
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 uppercase tracking-widest">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 outline-none"
              required
              placeholder="What's your idea?"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 uppercase tracking-widest">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 outline-none resize-none"
              required
              placeholder="Tell us more about your suggestion..."
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-strawberry-600 text-white rounded-2xl font-black italic uppercase tracking-widest shadow-lg shadow-strawberry-600/30 hover:bg-strawberry-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Submit Suggestion</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default SuggestionsPage;