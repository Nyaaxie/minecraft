import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkle, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { dbService } from '../../../services/dbService';
import { useAuthStore } from '../../../store/useAuthStore';

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
    <div className="h-[calc(100vh-6rem)] w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20 text-strawberry-600">
            <Sparkle size={32} />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
              Suggestions
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
              Plant a seed of suggestion here!
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full pr-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 p-10 rounded-[2.5rem] border border-neutral-200 dark:border-white/5 shadow-sm space-y-6">
            <div>
              <label htmlFor="title" className="block text-[10px] font-black text-neutral-500 mb-1.5 uppercase tracking-widest">Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-strawberry-500/10 transition-all"
                required
                placeholder="What's your idea?"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-[10px] font-black text-neutral-500 mb-1.5 uppercase tracking-widest">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-strawberry-500/10 transition-all resize-none"
                required
                placeholder="Tell us more about your suggestion..."
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-strawberry-600 text-white rounded-2xl font-black italic uppercase tracking-widest shadow-lg shadow-strawberry-600/20 hover:bg-strawberry-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={16} /> Submit Suggestion</>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SuggestionsPage;