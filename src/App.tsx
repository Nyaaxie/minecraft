import React, { Suspense, lazy } from 'react';
import { AuthProvider } from './features/auth/components/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import DashboardLayout from './components/DashboardLayout';
import { useAuthStore } from './store/useAuthStore';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const LoadingScreen = () => {
  const [showReset, setShowReset] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowReset(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleForceReset = () => {
    localStorage.removeItem('strawberry-auth');
    window.location.href = '/login';
  };

  return (
    <div className="flex items-center justify-center h-screen bg-neutral-950">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-strawberry-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-2">
          <p className="text-neutral-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading StrawberrySMP...</p>
          {showReset && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleForceReset}
              className="text-[10px] text-strawberry-500 hover:text-strawberry-400 font-black uppercase tracking-[0.2em] pt-4 block underline decoration-strawberry-500/30 underline-offset-4"
            >
              Stuck? Click here to Reset
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

// Lazy load pages for performance
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('./features/auth/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage'));
const VerificationPage = lazy(() => import('./features/auth/pages/VerificationPage'));
const LandingPage = lazy(() => import('./features/landing/pages/LandingPage'));
const EventsPage = lazy(() => import('./features/events/pages/EventsPage'));
const ProfilePage = lazy(() => import('./features/profile/pages/ProfilePage'));
const AdminPanel = lazy(() => import('./features/admin/pages/AdminPanel'));
const LiveMapPage = lazy(() => import('./features/livemap/pages/LiveMapPage'));
const AdminPluginsPage = lazy(() => import('./features/admin/pages/AdminPluginsPage'));
const ShopsPage = lazy(() => import('./features/shops/pages/ShopsPage'));
const AdminShopPage = lazy(() => import('./features/admin/pages/AdminShopPage'));
const AdminShopItemPage = lazy(() => import('./features/admin/pages/AdminShopItemPage'));
const AdminCategoriesPage = lazy(() => import('./features/admin/pages/AdminCategoriesPage'));
const MembersPage = lazy(() => import('./features/members/pages/MembersPage'));
const HelpPage = lazy(() => import('./features/help/pages/HelpPage'));
const SuggestionsPage = lazy(() => import('./features/suggestions/pages/SuggestionsPage'));
const StatusPage = lazy(() => import('./features/status/pages/StatusPage'));

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.profile);
  const loading = useAuthStore(state => state.loading);
  const signOut = useAuthStore(state => state.signOut);

  // 1. If we are still initializing, show loading screen
  if (loading) return <LoadingScreen />;

  // 2. If initialization finished and no user, go to login
  if (!user) return <Navigate to="/login" replace />;

  // 3. If we have a user but NO profile (meaning DB fetch returned null)
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-center p-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Profile Missing</h2>
        <p className="text-neutral-400 text-sm max-w-xs mb-8 uppercase tracking-tight font-bold">
          We found your account but couldn't load your berry profile. Try logging in again.
        </p>
        <button
          onClick={() => signOut()}
          className="px-8 py-3 bg-strawberry-600 text-white rounded-xl font-black italic uppercase tracking-widest text-xs hover:bg-strawberry-700 transition-all shadow-xl shadow-strawberry-600/20"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // 4. Registration Approval Check
  if (profile.approval_status !== 'approved' && profile.role !== 'admin') {
    return <StatusPage status={profile.approval_status as 'pending' | 'rejected' | 'banned'} reason={profile.rejection_reason} />;
  }

  // 5. Admin check
  if (adminOnly && profile.role !== 'admin') return <Navigate to="/help" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 selection:bg-strawberry-500 selection:text-white font-sans">
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#171717', color: '#fff' } }} />
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/verify" element={<VerificationPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />              <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route path="/dashboard" element={<Navigate to="/help" replace />} />

                <Route path="/livemap" element={<ProtectedRoute><DashboardLayout><LiveMapPage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/members" element={<DashboardLayout><MembersPage /></DashboardLayout>} />
                <Route path="/admin/plugins/new" element={<ProtectedRoute adminOnly><DashboardLayout><AdminPluginsPage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/plugins/:id" element={<ProtectedRoute adminOnly><DashboardLayout><AdminPluginsPage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/shops" element={<DashboardLayout><ShopsPage /></DashboardLayout>} />
                <Route path="/shops/new" element={<ProtectedRoute adminOnly><DashboardLayout><AdminShopPage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/shops/edit/:id" element={<ProtectedRoute adminOnly><DashboardLayout><AdminShopPage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/shops/:shopId/items/new" element={<ProtectedRoute adminOnly><DashboardLayout><AdminShopItemPage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/shops/:shopId/items/edit/:itemId" element={<ProtectedRoute adminOnly><DashboardLayout><AdminShopItemPage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/shops/:shopId/items/:itemId/edit" element={<ProtectedRoute adminOnly><DashboardLayout><AdminShopItemPage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/events" element={<ProtectedRoute><DashboardLayout><EventsPage /></DashboardLayout></ProtectedRoute>} />

                <Route path="/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute><DashboardLayout><HelpPage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/suggestions" element={<ProtectedRoute><DashboardLayout><SuggestionsPage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><DashboardLayout><AdminPanel /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/categories/:categoryType" element={<ProtectedRoute adminOnly><DashboardLayout><AdminCategoriesPage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/categories/:categoryType/new" element={<ProtectedRoute adminOnly><DashboardLayout><AdminCategoriesPage /></DashboardLayout></ProtectedRoute>} />
                <Route path="/admin/categories/:categoryType/edit/:id" element={<ProtectedRoute adminOnly><DashboardLayout><AdminCategoriesPage /></DashboardLayout></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
