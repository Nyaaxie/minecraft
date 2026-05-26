import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Culture', href: '#culture' },
    { name: 'History', href: '#history' },
    { name: 'Updates', href: '#updates' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent py-6">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-strawberry-600/20 group-hover:scale-110 transition-transform">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-xl font-black tracking-tighter text-neutral-900 dark:text-white uppercase italic">
            Strawberry<span className="text-strawberry-600">SMP</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-strawberry-600 dark:hover:text-strawberry-500 transition-colors">{link.name}</a>
          ))}
          <ThemeToggle />
          <Link to="/login" className="px-6 py-2 bg-strawberry-600 hover:bg-strawberry-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-strawberry-600/20">Login</Link>
        </div>
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <button className="text-neutral-900 dark:text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-white/5 p-6 flex flex-col gap-4 md:hidden shadow-xl">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-lg font-medium text-neutral-600 dark:text-neutral-300 hover:text-strawberry-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>{link.name}</a>
          ))}
          <Link to="/login" className="w-full py-3 bg-strawberry-600 text-center text-white font-bold rounded-xl shadow-lg shadow-strawberry-600/20" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
        </motion.div>
      )}
    </nav>
  );
};

const LandingPage = () => {
  return (
    <div className="relative bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-x-hidden selection:bg-strawberry-500 selection:text-white">
      <Navbar />
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="text-center">
            <h1 className="text-7xl font-black">StrawberrySMP</h1>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;