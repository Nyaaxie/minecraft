import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dbService } from '../services/dbService';
import type { Rule } from '../types/database.types';

const RulesPage = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const fetchedRules = await dbService.getRules();
        setRules(fetchedRules.sort((a, b) => (b.priority || 0) - (a.priority || 0)));
      } catch (err) {
        console.error('Error fetching rules:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <Link to="/server-info" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-strawberry-600 transition-colors group mb-8">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Server Info
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20">
            <ShieldCheck className="text-strawberry-600" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">Rules</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-strawberry-600" size={48} />
          </div>
        ) : rules.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 p-12 rounded-[3rem] text-center border border-neutral-200 dark:border-white/5">
            <p className="text-neutral-500 font-black uppercase italic tracking-tighter">No rules defined yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {rules.map((rule, index) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-white/5 hover:border-strawberry-500/30 transition-all shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="text-2xl font-black italic text-strawberry-500/50 pt-1">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 italic tracking-tight">{rule.title}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{rule.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RulesPage;