import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Menu, X, Heart, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

// ─── Font injection (Playfair Display for title) ───────────────────────────
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=DM+Sans:wght@300;400;500&display=swap';
document.head.appendChild(fontLink);

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
    { name: 'Updates', href: '#updates' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 py-5 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg font-black tracking-tight text-neutral-900 dark:text-white italic">
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

// ─── Landing Page ────────────────────────────────────────────────────────────
const LandingPage = () => {
  return (
    <div className="relative bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-x-hidden selection:bg-strawberry-400 selection:text-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">

        {/* Soft radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-strawberry-400/10 dark:bg-strawberry-600/10 blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-pink-300/10 dark:bg-pink-500/10 blur-2xl" />
        </div>

        <FloatingPetals />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">

          {/* Greeting badge */}
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

          {/* Title — responsive, no overflow */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[clamp(2.6rem,10vw,7rem)] font-black italic leading-[0.95] tracking-tight text-neutral-900 dark:text-white mb-6"
          >
            Strawberry
            <span className="block text-strawberry-600">SMP</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base md:text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto mb-10"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            A cute private Filipino SMP dedicated for <span className="text-strawberry-500 font-semibold">GIRLS!</span> ༉‧₊˚{' '}
            Featuring cozy vanilla gameplay and a peaceful family-friendly atmosphere along with a humble, kind, and friendly community who simply loves playing Minecraft ~
          </motion.p>

          {/* CTA buttons */}
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
            <a
              href="#culture"
              className="px-8 py-3.5 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl transition-all text-sm uppercase tracking-widest"
            >
              Learn More
            </a>
          </motion.div>

          {/* Cute little heart divider */}
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
    </div>
  );
};

export default LandingPage;