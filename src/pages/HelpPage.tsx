import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Terminal, Puzzle, BookOpen, ArrowLeft, Loader2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dbService } from '../services/dbService';
import { useAuthStore } from '../store/useAuthStore';

const HelpPage = () => {
  const [data, setData] = useState<{ commands: any[]; plugins: any[]; guides: any[] }>({ commands: [], plugins: [], guides: [] });
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast.error('You must be logged in to submit a help request.');
        return;
    }
    setIsSubmitting(true);
    
    try {
        await dbService.createHelpRequest({ user_id: user.id, subject, message });
        toast.success('Help request submitted successfully! We will get back to you soon.');
        setSubject('');
        setMessage('');
    } catch (err) {
        console.error(err);
        toast.error('Failed to submit help request.');
    } finally {
        setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commands, plugins, guides] = await Promise.all([
          dbService.getCommands(),
          dbService.getPlugins(),
          dbService.getGuides(),
        ]);
        setData({ commands, plugins, guides });
      } catch (err) {
        console.error('Error fetching help data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-strawberry-600" size={48} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <Link to="/dashboard" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-strawberry-600 transition-colors group mb-8">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20">
            <HelpCircle className="text-strawberry-600" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">Help Center</h1>
        </div>

        <section id="commands" className="space-y-6">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <Terminal className="text-strawberry-600" /> Commands
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.commands.map((cmd: any) => (
              <div key={cmd.id} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-white/5">
                <code className="text-strawberry-600 font-bold bg-strawberry-500/10 px-2 py-1 rounded-md">{cmd.name}</code>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 whitespace-pre-line max-h-40 overflow-y-auto pr-2">{cmd.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="plugins" className="space-y-6">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <Puzzle className="text-strawberry-600" /> Plugins
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.plugins.map((plugin: any) => (
              <div key={plugin.id} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-white/5">
                <h3 className="font-bold text-neutral-900 dark:text-white">{plugin.name}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 whitespace-pre-line max-h-40 overflow-y-auto pr-2">{plugin.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="guides" className="space-y-6">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <BookOpen className="text-strawberry-600" /> Guides
          </h2>
          <div className="grid gap-4">
            {data.guides.map((guide: any) => (
              <div key={guide.id} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-white/5">
                <h3 className="font-bold text-neutral-900 dark:text-white">{guide.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 whitespace-pre-line max-h-60 overflow-y-auto pr-2">{guide.content}</p>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 p-12 rounded-[3rem] border border-neutral-200 dark:border-white/5 shadow-sm space-y-8">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Need more help?</h2>
          <div>
            <label htmlFor="subject" className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 uppercase tracking-widest">Subject</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 outline-none"
              required
              placeholder="What do you need help with?"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 uppercase tracking-widest">Message</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-strawberry-600 outline-none resize-none"
              required
              placeholder="Describe your issue..."
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-strawberry-600 text-white rounded-2xl font-black italic uppercase tracking-widest shadow-lg shadow-strawberry-600/30 hover:bg-strawberry-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Send Request</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default HelpPage;