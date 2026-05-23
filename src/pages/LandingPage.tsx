import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useSpring, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Users, 
  ShieldCheck, 
  Bell, 
  CheckCircle2, 
  ChevronRight, 
  Play, 
  Calendar,
  AlertCircle,
  Clock,
  Info,
  Menu,
  X,
  Server,
  Globe,
  Cpu,
  Tag
} from 'lucide-react';
import { dbService } from '../services/dbService';
import type { Rule, Reminder, MinecraftVersion, Plugin } from '../types/database.types';

// --- Components ---

const PluginLandingCard = ({ plugin }: { plugin: Plugin }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-neutral-900 border border-white/5 p-8 rounded-[2rem] hover:border-strawberry-500/30 transition-all group flex flex-col h-full"
    >
      <div className="flex items-center gap-4 mb-6">
        {plugin.icon_url ? (
          <img src={plugin.icon_url} alt={plugin.name} className="w-12 h-12 object-contain rounded-xl" loading="lazy" />
        ) : (
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-neutral-400">
            <Tag size={24} />
          </div>
        )}
        <h3 className="text-xl font-bold text-white italic tracking-tight">{plugin.name}</h3>
      </div>
      <p className="text-neutral-400 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
        {plugin.description || 'No description provided.'}
      </p>
      <div className="flex items-center justify-between text-xs font-bold text-neutral-500 uppercase tracking-widest mt-auto">
        <span>{plugin.category || 'Uncategorized'}</span>
        <span className="text-strawberry-500">v{plugin.version || '1.0'}</span>
      </div>
    </motion.div>
  );
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Culture', href: '#culture' },
    { name: 'History', href: '#history' },
    { name: 'Rules', href: '#rules' },
    { name: 'Plugins', href: '#plugins' },
    { name: 'Updates', href: '#updates' },
    { name: 'Versions', href: '#versions' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-neutral-950/80 backdrop-blur-md py-4 border-b border-white/5' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-strawberry-600/20 group-hover:scale-110 transition-transform">
            <img src="/src/assets/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase italic">
            Strawberry<span className="text-strawberry-500">SMP</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-sm font-medium text-neutral-400 hover:text-strawberry-500 transition-colors"
            >
              {link.name}
            </a>
          ))}
          <Link 
            to="/login" 
            className="px-6 py-2 bg-strawberry-600 hover:bg-strawberry-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-strawberry-600/20"
          >
            Login
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-neutral-900 border-b border-white/5 p-6 flex flex-col gap-4 md:hidden"
        >
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-lg font-medium text-neutral-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <Link 
            to="/login" 
            className="w-full py-3 bg-strawberry-600 text-center text-white font-bold rounded-xl"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Login
          </Link>
        </motion.div>
      )}
    </nav>
  );
};

const SectionHeading = ({ children, subtitle, center = false }: { children: React.ReactNode, subtitle?: string, center?: boolean }) => (
  <div className={`mb-16 ${center ? 'text-center' : ''}`}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {subtitle && (
        <span className="text-strawberry-500 font-bold tracking-widest uppercase text-xs mb-3 block italic">
          {subtitle}
        </span>
      )}
      <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
        {children}
      </h2>
    </motion.div>
  </div>
);

const TimelineItem = ({ year, title, description, side = 'left' }: { year: string, title: string, description: string, side?: 'left' | 'right' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className={`relative flex items-center justify-between mb-12 md:mb-24 w-full ${side === 'right' ? 'md:flex-row-reverse' : ''}`}>
      <div className="hidden md:block w-5/12" />
      
      {/* Circle Dot */}
      <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-strawberry-600 shadow-xl shadow-strawberry-600/50 z-10">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>

      <motion.div 
        className="w-full md:w-5/12 pl-12 md:pl-0"
        initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="bg-neutral-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-sm hover:border-strawberry-500/30 transition-colors group">
          <span className="text-strawberry-500 font-black text-xl mb-2 block italic">{year}</span>
          <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{title}</h3>
          <p className="text-neutral-400 leading-relaxed text-sm md:text-base">
            {description}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// Generate floating hearts configuration once outside the component
const generateFloatingHearts = () => {
  const hearts = [];
  for (let i = 0; i < 6; i++) {
    hearts.push({
      x: Math.floor(Math.random() * 100) + '%',
      y: Math.floor(Math.random() * 100) + '%',
      duration: 5 + Math.floor(Math.random() * 5),
      size: 24 + Math.floor(Math.random() * 40)
    });
  }
  return hearts;
};

const memoizedFloatingHearts = generateFloatingHearts();

const LandingPage = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [versions, setVersions] = useState<MinecraftVersion[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rulesData, remindersData, versionsData, pluginsData] = await Promise.all([
          dbService.getRules(),
          dbService.getReminders(),
          dbService.getMinecraftVersions(),
          dbService.getPlugins()
        ]);
        setRules(rulesData.slice(0, 4));
        setReminders(remindersData.slice(0, 3));
        setVersions(versionsData);
        setPlugins(pluginsData.filter(p => p.is_visible).slice(0, 6));
      } catch (err) {
        console.error('Error fetching landing page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentVersion = versions.find(v => v.is_supported && v.is_recommended) || versions[0];

  return (
    <div className="relative bg-neutral-950 text-neutral-100 overflow-x-hidden selection:bg-strawberry-500 selection:text-white">
      {/* Scroll Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-strawberry-600 origin-left z-[60]" style={{ scaleX }} />

      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-strawberry-600/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-strawberry-900/10 blur-[150px] rounded-full animate-pulse transition-all duration-1000" />
        </div>

        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-strawberry-600/10 border border-strawberry-600/20 text-strawberry-500 text-xs font-black tracking-widest uppercase italic mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-strawberry-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-strawberry-500"></span>
              </span>
              Server Status: Online
            </motion.div>

            <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter uppercase italic leading-[0.9] mb-8">
              STRAWBERRY<br />
              <span className="text-strawberry-600">SMP</span>
            </h1>

            <p className="text-lg md:text-2xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              A private community focused on peaceful gameplay, 
              genuine friendships, and the simple joy of building a home together.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                to="/signup" 
                className="group relative px-10 py-5 bg-strawberry-600 text-white font-black rounded-2xl shadow-2xl shadow-strawberry-600/30 overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center justify-center gap-2 text-lg italic uppercase">
                  Join Community <ChevronRight size={20} />
                </span>
              </Link>
              <a 
                href="#rules" 
                className="px-10 py-5 bg-neutral-900/50 border border-white/10 backdrop-blur-md text-white font-black rounded-2xl hover:bg-neutral-800 transition-all text-lg italic uppercase"
              >
                View Rules
              </a>
            </div>
          </motion.div>

          {/* Version Badge */}
          {currentVersion && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-16 flex items-center gap-6 px-8 py-4 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm"
            >
              <div className="flex flex-col items-start border-r border-white/10 pr-6">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-1">Version</span>
                <span className="text-white font-black italic">{currentVersion.version_string}</span>
              </div>
              <div className="flex flex-col items-start border-r border-white/10 pr-6">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-1">Platform</span>
                <span className="text-white font-black italic">{currentVersion.supports_java ? 'Java' : ''} {currentVersion.supports_bedrock ? '& Bedrock' : ''}</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-1">Experience</span>
                <span className="text-white font-black italic">Cozy Survival</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Floating Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          {memoizedFloatingHearts.map((heart, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ x: heart.x, y: heart.y }}
              animate={{ 
                y: [null, '-20px', '20px', null],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: heart.duration, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Heart className="text-strawberry-500" size={heart.size} fill="currentColor" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- CULTURE SECTION --- */}
      <section id="culture" className="py-32 relative overflow-hidden bg-neutral-900/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <SectionHeading subtitle="Our Values">
                Community <span className="text-strawberry-600">Culture</span>
              </SectionHeading>
              
              <div className="space-y-12">
                <div className="flex gap-6 group">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-strawberry-600/10 flex items-center justify-center group-hover:bg-strawberry-600 transition-colors">
                    <Heart className="text-strawberry-500 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 italic uppercase tracking-tight">Simplicity over Fame</h3>
                    <p className="text-neutral-400 leading-relaxed">
                      We value the simple joys of Minecraft. No rushing, no grinding for numbers, 
                      and no pressure to be the most active player. We just want to enjoy the game.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 group">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-strawberry-600/10 flex items-center justify-center group-hover:bg-strawberry-600 transition-colors">
                    <Users className="text-strawberry-500 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 italic uppercase tracking-tight">Kindness First</h3>
                    <p className="text-neutral-400 leading-relaxed">
                      Our community is built on humble, kind, and friendly individuals who see 
                      Minecraft as their second home and value genuine connections.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 group">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-strawberry-600/10 flex items-center justify-center group-hover:bg-strawberry-600 transition-colors">
                    <Play className="text-strawberry-500 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 italic uppercase tracking-tight">Peaceful Gameplay</h3>
                    <p className="text-neutral-400 leading-relaxed">
                      A small, private server where peace is prioritized. We focus on building, 
                      sharing, and enjoying the SMP life together at our own pace.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative rounded-[3rem] overflow-hidden border-8 border-neutral-900 shadow-2xl shadow-strawberry-900/20"
              >
                <img 
                  src="/src/assets/cultureimg.jpg" 
                  alt="Community Culture" 
                  className="w-full h-auto grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60" />
              </motion.div>
              
              {/* Floating Stat Card */}
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="absolute -bottom-10 -right-10 bg-neutral-900 border border-white/5 p-8 rounded-3xl shadow-2xl backdrop-blur-xl hidden md:block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-strawberry-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-white" />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Community Size</p>
                    <p className="text-2xl font-black text-white italic">Small & Private</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* --- HISTORY SECTION --- */}
      <section id="history" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-5xl">
          <SectionHeading subtitle="The Journey" center>
            Our <span className="text-strawberry-600">Origins</span>
          </SectionHeading>

          <div className="relative pt-12">
            {/* Timeline Line */}
            <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-strawberry-600 via-strawberry-500/50 to-transparent" />
            
            <TimelineItem 
              year="Late 2021"
              title="The First Experience"
              description="The journey began on Henosis SMP, where our founders first experienced SMP life. The 'Five Lives' season was a pivotal moment that cemented our love for shared Minecraft stories."
              side="left"
            />

            <TimelineItem 
              year="July 20, 2022"
              title="Eunoia SMP Born"
              description="Our own path started with Eunoia SMP. We learned the ropes of server management through community support and countless tutorials, focusing on building a respectful environment."
              side="right"
            />

            <TimelineItem 
              year="Present Day"
              title="StrawberrySMP Evolution"
              description="Eunoia evolved into StrawberrySMP. Today, we stand as a peaceful community centered around friendship, simplicity, and a shared love for the game."
              side="left"
            />
          </div>
        </div>
      </section>

      {/* --- RULES SECTION --- */}
      <section id="rules" className="py-32 bg-neutral-900/20 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <SectionHeading subtitle="Server Laws">
              The <span className="text-strawberry-600">Golden Rules</span>
            </SectionHeading>
            <Link 
              to="/signup" 
              className="flex items-center gap-2 text-strawberry-500 font-black italic uppercase tracking-tighter hover:gap-4 transition-all mb-16"
            >
              Read full rules <ChevronRight />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-white/5 rounded-[2rem] animate-pulse" />
              ))
            ) : rules.length > 0 ? (
              rules.map((rule) => (
                <motion.div 
                  key={rule.id}
                  whileHover={{ y: -10 }}
                  className="bg-neutral-900 border border-white/5 p-8 rounded-[2rem] hover:border-strawberry-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-strawberry-600 transition-colors">
                      <ShieldCheck className="text-strawberry-500 group-hover:text-white" size={24} />
                    </div>
                    {rule.category && (
                      <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:text-strawberry-400 transition-colors">
                        {rule.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 italic tracking-tight">{rule.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed line-clamp-4">
                    {rule.content}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white/5 rounded-[3rem]">
                <ShieldCheck className="mx-auto text-neutral-600 mb-4" size={48} />
                <p className="text-neutral-500">Rules are being updated. Please check back later.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- PLUGINS SECTION --- */}
      <section id="plugins" className="py-32">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="Server Enhancements">
            Featured <span className="text-strawberry-600">Plugins</span>
          </SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-white/5 rounded-[2rem] animate-pulse" />
              ))
            ) : plugins.length > 0 ? (
              plugins.map((plugin) => (
                <PluginLandingCard key={plugin.id} plugin={plugin} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white/5 rounded-[3rem]">
                <p className="text-neutral-500">No plugins featured at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- UPDATES & REMINDERS --- */}
      <section id="updates" className="py-32">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="Stay Informed">
            Latest <span className="text-strawberry-600">Updates</span>
          </SectionHeading>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Reminders & Alerts */}
            <div className="lg:col-span-2 space-y-8">
              {loading ? (
                <div className="h-96 bg-white/5 rounded-[3rem] animate-pulse" />
              ) : reminders.length > 0 ? (
                reminders.map((reminder) => (
                  <motion.div 
                    key={reminder.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className={`relative p-8 rounded-[2.5rem] border overflow-hidden ${reminder.is_important ? 'bg-strawberry-900/10 border-strawberry-500/30' : 'bg-neutral-900 border-white/5'}`}
                  >
                    {reminder.is_important && (
                      <div className="absolute top-0 right-0 px-6 py-2 bg-strawberry-600 text-white text-[10px] font-black uppercase tracking-widest italic rounded-bl-3xl">
                        Important
                      </div>
                    )}
                    <div className="flex items-start gap-6">
                      <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${reminder.is_important ? 'bg-strawberry-600' : 'bg-white/5'}`}>
                        <Bell className={reminder.is_important ? 'text-white' : 'text-strawberry-500'} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2 italic">{reminder.title}</h3>
                        <p className="text-neutral-400 mb-6 leading-relaxed">
                          {reminder.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(reminder.created_at).toLocaleDateString()}</span>
                          {reminder.expires_at && (
                            <span className="flex items-center gap-1.5 text-orange-500/70"><AlertCircle size={14} /> Expires: {new Date(reminder.expires_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-20 text-center bg-neutral-900 rounded-[3rem] border border-white/5">
                  <Info className="mx-auto text-neutral-700 mb-4" size={40} />
                  <p className="text-neutral-500">No active reminders at the moment.</p>
                </div>
              )}
            </div>

            {/* Maintenance & Events Sidebar */}
            <div className="space-y-8">
              <div className="bg-neutral-900 border border-white/5 p-8 rounded-[2.5rem]">
                <h3 className="text-xl font-black text-white italic uppercase mb-8 border-b border-white/5 pb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-strawberry-500" /> Community Events
                </h3>
                <div className="space-y-6">
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Check our server calendar for upcoming dragon fights, building competitions, and seasonal celebrations.
                  </p>
                  <Link 
                    to="/signup" 
                    className="w-full py-4 bg-white/5 hover:bg-strawberry-600 border border-white/5 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase italic"
                  >
                    Login to view events <ChevronRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="bg-strawberry-600/10 border border-strawberry-500/20 p-8 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-strawberry-500/10 blur-3xl rounded-full" />
                <h3 className="text-xl font-black text-white italic uppercase mb-4 relative z-10">Quick Join</h3>
                <p className="text-strawberry-200/70 text-sm mb-6 relative z-10 italic font-medium">
                  Ready to start your adventure? Join our family-friendly SMP today.
                </p>
                <Link 
                  to="/signup" 
                  className="w-full py-4 bg-strawberry-600 text-white font-black rounded-2xl shadow-xl shadow-strawberry-600/20 relative z-10 flex items-center justify-center gap-2 text-sm uppercase italic"
                >
                  Join Community
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- VERSIONS SECTION --- */}
      <section id="versions" className="py-32 bg-neutral-900/30">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="Technical Specs" center>
            Server <span className="text-strawberry-600">Compatibility</span>
          </SectionHeading>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-white/5 rounded-[2.5rem] animate-pulse" />
              ))
            ) : versions.length > 0 ? (
              versions.map((v) => (
                <div 
                  key={v.id}
                  className={`relative p-10 rounded-[2.5rem] border transition-all ${v.is_recommended ? 'bg-neutral-900 border-strawberry-500/40 shadow-2xl shadow-strawberry-900/10' : 'bg-neutral-900 border-white/5'}`}
                >
                  {v.is_recommended && (
                    <div className="absolute top-0 right-0 px-6 py-2 bg-strawberry-600 text-white text-[10px] font-black uppercase tracking-widest italic rounded-bl-3xl">
                      Recommended
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${v.is_supported ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      <Server className={v.is_supported ? 'text-green-500' : 'text-red-500'} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white italic">{v.version_string}</h3>
                      <p className={`text-xs font-bold uppercase tracking-widest ${v.is_supported ? 'text-green-500/70' : 'text-red-500/70'}`}>
                        {v.is_supported ? 'Supported' : 'Outdated'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2"><Globe size={14} /> Java Edition</span>
                      <span className={`font-black italic ${v.supports_java ? 'text-white' : 'text-neutral-700'}`}>{v.supports_java ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2"><Cpu size={14} /> Bedrock Edition</span>
                      <span className={`font-black italic ${v.supports_bedrock ? 'text-white' : 'text-neutral-700'}`}>{v.supports_bedrock ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} /> Maintenance</span>
                      <span className={`font-black italic ${v.maintenance_mode ? 'text-orange-500' : 'text-green-500'}`}>{v.maintenance_mode ? 'Active' : 'None'}</span>
                    </div>
                  </div>

                  {v.changelog && (
                    <div className="pt-6 border-t border-white/5">
                      <p className="text-neutral-500 text-xs leading-relaxed italic line-clamp-2">
                        {v.changelog}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <p className="text-neutral-500">Version data currently unavailable.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 border-t border-white/5 relative overflow-hidden bg-neutral-950">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <img src="/src/assets/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
                <span className="text-xl font-black tracking-tighter text-white uppercase italic">
                  Strawberry<span className="text-strawberry-500">SMP</span>
                </span>
              </Link>
              <p className="text-neutral-400 max-w-sm leading-relaxed mb-8">
                A community-driven Minecraft server focused on peaceful, genuine gameplay. 
                Founded on the principles of kindness, simplicity, and shared creativity.
              </p>
              <div className="flex gap-4">
                {/* Social Placeholders */}
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-neutral-500 hover:text-strawberry-500 hover:border-strawberry-500/30 transition-all cursor-pointer">
                    <Globe size={18} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white font-black italic uppercase mb-8 tracking-widest">Navigation</h4>
              <ul className="space-y-4">
                <li><a href="#culture" className="text-neutral-400 hover:text-strawberry-500 transition-colors">Culture</a></li>
                <li><a href="#history" className="text-neutral-400 hover:text-strawberry-500 transition-colors">History</a></li>
                <li><a href="#rules" className="text-neutral-400 hover:text-strawberry-500 transition-colors">Rules</a></li>
                <li><a href="#plugins" className="text-neutral-400 hover:text-strawberry-500 transition-colors">Plugins</a></li>
                <li><a href="#updates" className="text-neutral-400 hover:text-strawberry-500 transition-colors">Updates</a></li>
                <li><a href="#versions" className="text-neutral-400 hover:text-strawberry-500 transition-colors">Versions</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-black italic uppercase mb-8 tracking-widest">Support</h4>
              <ul className="space-y-4">
                <li><Link to="/login" className="text-neutral-400 hover:text-strawberry-500 transition-colors">Player Login</Link></li>
                <li><Link to="/signup" className="text-neutral-400 hover:text-strawberry-500 transition-colors">Join Community</Link></li>
                <li><span className="text-neutral-400">Discord Group Chat</span></li>
                <li><span className="text-neutral-400">Help Center</span></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-white/5 gap-6 text-sm text-neutral-600 font-bold uppercase tracking-widest">
            <p>© {new Date().getFullYear()} StrawberrySMP Community. Not an official Minecraft product.</p>
            <div className="flex gap-8 italic">
              <span className="hover:text-neutral-400 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-neutral-400 cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>

        {/* Bottom Glow */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-strawberry-600/10 blur-[100px] rounded-full" />
      </footer>
    </div>
  );
};

export default LandingPage;
