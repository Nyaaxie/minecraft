import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl shadow-neutral-900/20 w-full ${sizeClasses[size]} pointer-events-auto overflow-hidden`}
            >
              <div className="flex items-center justify-between p-7 pb-4">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">
                  {title}
                </h3>
                <button 
                  onClick={onClose} 
                  className="p-2.5 bg-neutral-100 dark:bg-white/5 rounded-2xl text-neutral-500 hover:text-strawberry-600 hover:bg-strawberry-500/10 transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-7 pt-2">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

