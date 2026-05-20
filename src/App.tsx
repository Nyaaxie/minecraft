import React, { Suspense, lazy } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/useAuthStore';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Lazy load pages for performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const DynaMapPage = lazy(() => import('./pages/DynaMapPage'));

import DashboardLayout from './components/DashboardLayout';

const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-neutral-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-strawberry-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-neutral-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading StrawberrySMP...</p>
    </div>
  </div>
);

const HomePage = () => (
  <div className="flex items-center justify-center h-screen flex-col text-center px-4 bg-neutral-950 overflow-hidden relative">
    {/* Background Glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-strawberry-600/20 blur-[120px] rounded-full -z-10" />
    
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl relative z-10"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="inline-block px-4 py-1.5 mb-6 rounded-full bg-strawberry-600/10 border border-strawberry-600/20 text-strawberry-500 text-sm font-bold tracking-wider uppercase"
      >
        Season 4 is Live!
      </motion.div>
      <h1 className="text-6xl md:text-8xl font-black text-strawberry-600 tracking-tighter italic uppercase leading-tight">
        STRAWBERRY<br /><span className="text-white">SMP</span>
      </h1>
      <p className="mt-8 text-xl text-neutral-400 leading-relaxed max-w-xl mx-auto">
        The ultimate management platform for the Strawberry community. 
        Track events, chat with players, and stay updated with live announcements.
      </p>
      <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/signup" className="px-10 py-4 bg-strawberry-600 rounded-2xl font-bold hover:bg-strawberry-700 transition-all shadow-xl shadow-strawberry-600/30 text-lg">
          Join Community
        </Link>
        <Link to="/login" className="px-10 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl font-bold hover:bg-neutral-800 transition-all text-lg">
          Player Login
        </Link>
      </div>
    </motion.div>
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, profile, loading } = useAuthStore();
  
  if (loading) return <LoadingScreen />;
  
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

function App() {
  useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-strawberry-500 selection:text-white font-sans">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DashboardPage />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route path="/dynamap" element={<ProtectedRoute><DashboardLayout><DynaMapPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><DashboardLayout><EventsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><DashboardLayout><MessagesPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><DashboardLayout><NotificationsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><DashboardLayout><AdminPanel /></DashboardLayout></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
