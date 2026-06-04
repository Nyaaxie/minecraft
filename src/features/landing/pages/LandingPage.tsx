import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Menu, X, Heart, Sparkles, Users, Play, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '../../../components/ThemeToggle';

// ─── Floating petals background ────────────────────────────────────────────
const PETALS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: Math.random() * 8,
  duration: 6 + Math.random() * 6,
  size: 8 + Math.random() * 14,
  opacity: 0.15 + Math.random() * 0.25,
}));

const FloatingPetals = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {PETALS.map(p => (
      <motion.div
        key={p.id}
        className="absolute text-strawberry-400 dark:text-strawberry-600 select-none"
        style={{ left: p.left, top: '-20px', fontSize: p.size, opacity: p.opacity }}
        animate={{ y: ['0vh', '110vh'], rotate: [0, 360], x: [0, 30, -20, 10, 0] }}
        transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
      >
        🌸
      </motion.div>
    ))}
  </div>
);

// ─── Navbar ─────────────────────────────────────────────────────────────────
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { name: 'Culture', href: '#culture' },
    { name: 'History', href: '#history' },
    {},
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 py-5 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <span style={{ fontFamily: "'Genty', serif" }} className="text-lg font-bold italic tracking-tight text-neutral-900 dark:text-white">
            Strawberry<span className="text-strawberry-600">SMP</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <a key={link.name} href={link.href}
              className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-strawberry-600 dark:hover:text-strawberry-400 transition-colors">
              {link.name}
            </a>
          ))}
          <ThemeToggle />
          <Link to="/login" className="px-5 py-2 bg-strawberry-600 hover:bg-strawberry-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-strawberry-600/20 active:scale-95">
            Login
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-3">
          <ThemeToggle />
          <button className="text-neutral-900 dark:text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-100 dark:border-white/5 p-6 flex flex-col gap-4 md:hidden shadow-xl"
        >
          {navLinks.map(link => (
            <a key={link.name} href={link.href}
              className="text-base font-medium text-neutral-600 dark:text-neutral-300 hover:text-strawberry-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}>
              {link.name}
            </a>
          ))}
          <Link to="/login"
            className="w-full py-3 bg-strawberry-600 text-center text-white font-bold rounded-xl shadow-lg shadow-strawberry-600/20"
            onClick={() => setIsMobileMenuOpen(false)}>
            Login
          </Link>
        </motion.div>
      )}
    </nav>
  );
};

// ─── Section Heading ─────────────────────────────────────────────────────────
const SectionHeading = ({ children, subtitle, center = false }: { children: React.ReactNode, subtitle?: string, center?: boolean }) => (
  <div className={`mb-16 ${center ? 'text-center' : ''}`}>
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      {subtitle && (
        <span className="text-strawberry-500 font-bold tracking-widest uppercase text-xs mb-3 block italic">
          {subtitle}
        </span>
      )}
      <h2 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase italic leading-none">
        {children}
      </h2>
    </motion.div>
  </div>
);

// ─── Timeline Item ───────────────────────────────────────────────────────────
const TimelineItem = ({ year, title, description, side = 'left' }: { year: string, title: string, description: string, side?: 'left' | 'right' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className={`relative flex items-center justify-between mb-12 md:mb-24 w-full ${side === 'right' ? 'md:flex-row-reverse' : ''}`}>
      <div className="hidden md:block w-5/12" />
      <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-strawberry-600 shadow-xl shadow-strawberry-600/50 z-10">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
      <motion.div
        className="w-full md:w-5/12 pl-12 md:pl-0"
        initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 p-8 rounded-3xl backdrop-blur-sm hover:border-strawberry-500/30 transition-colors shadow-sm dark:shadow-none">
          <span className="text-strawberry-500 font-black text-xl mb-2 block italic">{year}</span>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4 tracking-tight">{title}</h3>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm md:text-base">{description}</p>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Landing Page ────────────────────────────────────────────────────────────
const LandingPage = () => {
  return (
    <div className="relative bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-x-hidden selection:bg-strawberry-400 selection:text-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-strawberry-400/10 dark:bg-strawberry-600/10 blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-pink-300/10 dark:bg-pink-500/10 blur-2xl" />
        </div>

        <FloatingPetals />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-strawberry-50 dark:bg-strawberry-950/60 border border-strawberry-200 dark:border-strawberry-800/50 text-strawberry-600 dark:text-strawberry-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Sparkles size={12} />
            Sweet to meet you!
            <Sparkles size={12} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ fontFamily: "'Genty', serif" }}
            className="text-[clamp(2.6rem,10vw,7rem)] font-bold italic leading-[0.95] tracking-tight text-neutral-900 dark:text-white mb-6"
          >
            Strawberry
            <span className="block text-strawberry-600">SMP</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base md:text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto mb-10"
          >
            A cute private Filipino SMP dedicated for <span className="text-strawberry-500 font-semibold">GIRLS!</span> ༉‧₊˚{' '}
            Featuring cozy vanilla gameplay and a peaceful family-friendly atmosphere along with a humble, kind, and friendly community who simply loves playing Minecraft ~
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to="/login"
              className="px-8 py-3.5 bg-strawberry-600 hover:bg-strawberry-700 text-white font-bold rounded-2xl shadow-xl shadow-strawberry-600/25 active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              Join Community
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 flex items-center justify-center gap-2 text-strawberry-300 dark:text-strawberry-700"
          >
            <div className="h-px w-16 bg-strawberry-200 dark:bg-strawberry-800" />
            <Heart size={12} className="fill-current" />
            <div className="h-px w-16 bg-strawberry-200 dark:bg-strawberry-800" />
          </motion.div>
        </div>
      </section>

      {/* ── Culture ── */}
      <section id="culture" className="py-32 relative overflow-hidden bg-neutral-100 dark:bg-neutral-900/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <SectionHeading subtitle="Our Values">
                Community <span className="text-strawberry-600">Culture</span>
              </SectionHeading>

              <div className="space-y-12">
                <div className="flex gap-6 group">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-strawberry-500/10 flex items-center justify-center group-hover:bg-strawberry-600 transition-colors">
                    <Heart className="text-strawberry-600 dark:text-strawberry-500 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 italic uppercase tracking-tight">Simplicity over Fame</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      We value the simple joys of Minecraft. No rushing, no grinding for numbers,
                      and no pressure to be the most active player. We just want to enjoy the game.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 group">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-strawberry-500/10 flex items-center justify-center group-hover:bg-strawberry-600 transition-colors">
                    <Users className="text-strawberry-600 dark:text-strawberry-500 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 italic uppercase tracking-tight">Kindness First</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Our community is built on humble, kind, and friendly individuals who see
                      Minecraft as their second home and value genuine connections.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 group">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-strawberry-500/10 flex items-center justify-center group-hover:bg-strawberry-600 transition-colors">
                    <Play className="text-strawberry-600 dark:text-strawberry-500 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 italic uppercase tracking-tight">Peaceful Gameplay</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
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
                className="relative rounded-[3rem] overflow-hidden border-8 border-neutral-200 dark:border-neutral-900 shadow-2xl shadow-neutral-900/20"
              >
                <img
                  src="/cultureimg.jpg"
                  alt="Community Culture"
                  className="w-full h-auto grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-neutral-950 via-transparent to-transparent opacity-60" />
              </motion.div>

              <motion.div
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="absolute -bottom-10 -right-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 p-8 rounded-3xl shadow-2xl backdrop-blur-xl hidden md:block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-strawberry-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-white" />
                  </div>
                  <div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-xs font-bold uppercase tracking-widest">Community Size</p>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white italic">Small & Private</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── History ── */}
      <section id="history" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-5xl">
          <SectionHeading subtitle="The Journey" center>
            Our <span className="text-strawberry-600">Origins</span>
          </SectionHeading>

          <div className="relative pt-12">
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

      {/* ── Footer divider ── */}
      <footer className="py-10 border-t border-neutral-200 dark:border-white/5 text-center">
        <p className="text-xs text-neutral-400 dark:text-neutral-600 uppercase tracking-widest font-bold">
          © {new Date().getFullYear()} StrawberrySMP Community. Not an official Minecraft product.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;