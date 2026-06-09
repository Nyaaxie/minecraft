import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Terminal, Puzzle, BookOpen, Loader2, Send, ChevronDown, ShieldCheck, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import { dbService } from '../../../services/dbService';
import { adminService } from '../../../services/adminService';
import { useAuthStore } from '../../../store/useAuthStore';
import type { Rule } from '../../../types/database.types';

// ─── Section Card ───────────────────────────────────────────────────────────

const SectionCard = ({
  icon: Icon,
  title,
  count,
  color,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  count: number;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-white/5 shadow-sm overflow-hidden">
    {/* Header / trigger */}
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 px-7 py-6 group text-left transition-colors hover:bg-neutral-50 dark:hover:bg-white/[0.02]"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white leading-none">
            {title}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-0.5">
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-colors"
          style={{
            backgroundColor: isOpen ? `${color}15` : undefined,
            color: isOpen ? color : undefined,
          }}
        >
          {isOpen ? 'Collapse' : 'View all'}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <ChevronDown size={18} className="text-neutral-400" />
        </motion.div>
      </div>
    </button>

    {/* Expandable content */}
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ overflow: 'hidden' }}
        >
          <div className="px-7 pb-7 pt-2 border-t border-neutral-100 dark:border-white/5">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─── HelpPage ───────────────────────────────────────────────────────────────

const HelpPage = () => {
  const [data, setData] = useState<{ commands: any[]; plugins: any[]; guides: any[]; rules: Rule[]; serverInfo: any[] }>({
    commands: [],
    plugins: [],
    guides: [],
    rules: [],
    serverInfo: [],
  });
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const toggle = (id: string) => setOpenSection(prev => (prev === id ? null : id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to submit a help request.');
      return;
    }
    setIsSubmitting(true);
    try {
      await dbService.createHelpRequest({ user_id: user.id, subject, message });
      toast.success("Help request submitted! We'll get back to you soon.");
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
        const [commands, plugins, guides, rules, serverInfo] = await Promise.all([
          dbService.getCommands(),
          dbService.getPlugins(),
          dbService.getGuides(),
          dbService.getRules(),
          adminService.getServerInfo(),
        ]);
        setData({
          commands,
          plugins,
          guides,
          rules: rules.sort((a, b) => (b.priority || 0) - (a.priority || 0)),
          serverInfo: serverInfo || []
        });
      } catch (err) {
        console.error('Error fetching help data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-strawberry-600" size={48} />
      </div>
    );
  }

  const SECTIONS = [
    {
      id: 'rules',
      icon: ShieldCheck,
      title: 'Rules',
      color: '#f59e0b',
      count: data.rules.length,
      content: (
        <div className="space-y-4 mt-4">
          {data.rules.length === 0 ? (
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest py-8 text-center italic">
              No rules defined yet.
            </p>
          ) : data.rules.map((rule, index) => (
            <div
              key={rule.id}
              className="flex gap-4 bg-neutral-50 dark:bg-neutral-800/60 p-5 rounded-2xl border border-neutral-100 dark:border-white/5"
            >
              <div className="text-xl font-black italic text-orange-500/50 pt-1">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white mb-1 italic tracking-tight">{rule.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{rule.content}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'server-info',
      icon: Server,
      title: 'Server Info',
      color: '#3b82f6',
      count: data.serverInfo.length,
      content: (
        <div className="bg-white dark:bg-neutral-800/60 rounded-2xl border border-neutral-100 dark:border-white/5 overflow-hidden mt-4">
          {data.serverInfo.length === 0 ? (
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest py-8 text-center italic">
              No server info available.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-white/5">
              {data.serverInfo.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-6 px-5 py-4"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    {item.label}
                  </span>
                  <span className="text-sm font-black italic uppercase tracking-tight text-neutral-900 dark:text-white text-right">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'commands',
      icon: Terminal,
      title: 'Commands',
      color: '#ef4444',
      count: data.commands.length,
      content: (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {data.commands.length === 0 ? (
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest col-span-2 py-8 text-center italic">
              No commands registered yet.
            </p>
          ) : data.commands.map((cmd: any) => (
            <div
              key={cmd.id}
              className="bg-neutral-50 dark:bg-neutral-800/60 rounded-3xl p-6 border border-neutral-100 dark:border-white/5 hover:border-red-500/30 transition-all flex flex-col"
            >
              {/* Plugin Title */}
              <div className="flex items-center justify-between mb-2">
                {cmd.plugin_title ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-strawberry-600 bg-strawberry-500/10 px-2.5 py-1 rounded-lg">
                    {cmd.plugin_title}
                  </span>
                ) : <div />}
              </div>

              {/* Plugin Image */}
              {cmd.url && (
                <div className="mb-4 rounded-xl overflow-hidden border border-neutral-200 dark:border-white/5">
                  <img src={cmd.url} alt={cmd.plugin_title} className="w-full h-auto max-h-40 object-cover" />
                </div>
              )}

              {/* Plugin Description */}
              {cmd.plugin_description && (
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-5 italic opacity-70">
                  {cmd.plugin_description}
                </p>
              )}

              {/* Commands List */}
              <div className="space-y-4">
                {(Array.isArray(cmd.commands_data) && cmd.commands_data.length > 0 ? cmd.commands_data : [{ command: cmd.name, description: cmd.description }]).map((cd: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <Terminal size={12} className="text-red-500" />
                      </div>
                      <code className="text-strawberry-600 font-black bg-strawberry-500/10 px-2 py-0.5 rounded-md text-xs tracking-tight">
                        {cd.command}
                      </code>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed pl-9">
                      {cd.description}
                    </p>
                    {idx < (Array.isArray(cmd.commands_data) ? cmd.commands_data.length - 1 : 0) && (
                      <div className="h-px bg-neutral-200 dark:bg-white/5 mx-9 my-3" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'plugins',
      icon: Puzzle,
      title: 'Plugins',
      color: '#8b5cf6',
      count: data.plugins.length,
      content: (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {data.plugins.length === 0 ? (
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest col-span-2 py-8 text-center italic">
              No plugins listed yet.
            </p>
          ) : data.plugins.map((plugin: any) => (
            <div
              key={plugin.id}
              className="group bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl p-5 border border-neutral-100 dark:border-white/5 hover:border-violet-500/30 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Puzzle size={14} className="text-violet-500" />
                  </div>
                  <h3 className="font-black italic uppercase tracking-tight text-neutral-900 dark:text-white text-sm leading-tight">
                    {plugin.name}
                  </h3>
                </div>
                {plugin.version && (
                  <span className="text-[9px] font-black bg-violet-500/10 text-violet-500 px-2 py-1 rounded-lg shrink-0 tracking-widest uppercase">
                    v{plugin.version}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-neutral-200 dark:bg-white/5 mb-3" />

              {/* Description — no scroll, just clamped with expand */}
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-4">
                {plugin.description}
              </p>

              {plugin.category && (
                <div className="mt-3">
                  <span className="text-[9px] font-black bg-neutral-200 dark:bg-white/10 text-neutral-500 dark:text-neutral-400 px-2 py-1 rounded-lg uppercase tracking-widest">
                    {plugin.category}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'guides',
      icon: BookOpen,
      title: 'Guides',
      color: '#10b981',
      count: data.guides.length,
      content: (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {data.guides.length === 0 ? (
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest col-span-2 py-8 text-center italic">
              No guides published yet.
            </p>
          ) : data.guides.map((guide: any) => (
            <div
              key={guide.id}
              className="bg-neutral-50 dark:bg-neutral-800/60 rounded-3xl p-6 border border-neutral-100 dark:border-white/5 hover:border-emerald-500/30 transition-all flex flex-col"
            >
              {/* Guide header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <BookOpen size={14} className="text-emerald-500" />
                  </div>
                  <h3 className="font-black italic uppercase tracking-tight text-neutral-900 dark:text-white text-sm leading-tight">
                    {guide.title}
                  </h3>
                </div>
              </div>

              {/* Guide Image */}
              {guide.url && (
                <div className="mb-4 rounded-xl overflow-hidden border border-neutral-200 dark:border-white/5 bg-neutral-100 dark:bg-white/5">
                  <img src={guide.url} alt={guide.title} className="w-full h-auto max-h-40 object-cover object-center" />
                </div>
              )}
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line flex-grow">
                {guide.content}
              </p>
            </div>
          ))}
        </div>
      ),
    },

  ];

  return (
    <div className="h-[calc(100vh-6rem)] w-full overflow-y-auto pr-2">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between px-2 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20 text-strawberry-600">
              <HelpCircle size={32} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                Help
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
                A harvest of helpful knowledge!
              </p>
            </div>
          </div>
        </div>

        {/* The 5 accordion section cards */}
        <div className="space-y-3">
          {SECTIONS.map((section, i) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <SectionCard
                id={section.id}
                icon={section.icon}
                title={section.title}
                count={section.count}
                color={section.color}
                isOpen={openSection === section.id}
                onToggle={() => toggle(section.id)}
              >
                {section.content}
              </SectionCard>
            </motion.div>
          ))}
        </div>

        {/* Help request form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-neutral-900 p-10 rounded-[2.5rem] border border-neutral-200 dark:border-white/5 shadow-sm space-y-6"
        >
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Need more help?</h2>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Send us a request and we'll get back to you.</p>
          </div>
          <div>
            <label htmlFor="subject" className="block text-[10px] font-black text-neutral-500 mb-1.5 uppercase tracking-widest">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-sm font-bold placeholder:text-neutral-400 focus:outline-none focus:border-strawberry-500/50 focus:ring-2 focus:ring-strawberry-500/10 transition-all"
              required
              placeholder="What do you need help with?"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-[10px] font-black text-neutral-500 mb-1.5 uppercase tracking-widest">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-xl text-sm font-bold placeholder:text-neutral-400 focus:outline-none focus:border-strawberry-500/50 focus:ring-2 focus:ring-strawberry-500/10 transition-all resize-none"
              required
              placeholder="Describe your issue in detail..."
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-strawberry-600 text-white rounded-2xl font-black italic uppercase tracking-widest shadow-lg shadow-strawberry-600/20 hover:bg-strawberry-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting
              ? <Loader2 className="animate-spin" size={18} />
              : <><Send size={16} /> Send Request</>
            }
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default HelpPage;