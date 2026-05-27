import React, { Suspense, lazy } from 'react';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { useAuthStore } from './store/useAuthStore';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Lazy load pages for performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerificationPage = lazy(() => import('./pages/VerificationPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ServerInfoPage = lazy(() => import('./pages/ServerInfoPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const DynaMapPage = lazy(() => import('./pages/DynaMapPage'));
const PluginsPage = lazy(() => import('./pages/PluginsPage'));
const AdminPluginsPage = lazy(() => import('./pages/AdminPluginsPage'));
const ShopsPage = lazy(() => import('./pages/ShopsPage'));
const ShopDetailPage = lazy(() => import('./pages/ShopDetailPage'));
const AdminShopPage = lazy(() => import('./pages/AdminShopPage'));
const AdminShopItemPage = lazy(() => import('./pages/AdminShopItemPage'));
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage'));
const MembersPage = lazy(() => import('./pages/MembersPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const RulesPage = lazy(() => import('./pages/RulesPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const SuggestionsPage = lazy(() => import('./pages/SuggestionsPage'));

import DashboardLayout from './components/DashboardLayout';

const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-neutral-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-strawberry-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-neutral-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading StrawberrySMP...</p>
    </div>
  </div>
);

const StatusPage = lazy(() => import('./pages/StatusPage'));

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, profile, loading, signOut } = useAuthStore();
  
  // 1. Wait for auth to finish loading
  if (loading) return <LoadingScreen />;
  
  // 2. If no user, definitely go to login
  if (!user) return <Navigate to="/login" replace />;
  
  // 3. If profile missing, handle it
  if (!profile) {
    setTimeout(() => { signOut(); }, 2000);
    return <LoadingScreen />;
  }

  // 4. Registration Approval Check
  if (profile.approval_status !== 'approved' && profile.role !== 'admin') {
    return <StatusPage status={profile.approval_status as 'pending' | 'rejected' | 'banned'} reason={profile.rejection_reason} />;
  }
  
  // 5. Admin check
  if (adminOnly && profile.role !== 'admin') return <Navigate to="/server-info" replace />;
  
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
                
                <Route path="/dashboard" element={<Navigate to="/server-info" replace />} />
                <Route 
                  path="/server-info" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <ServerInfoPage />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } 
                />
              
              <Route path="/dynamap" element={<ProtectedRoute><DashboardLayout><DynaMapPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/plugins" element={<ProtectedRoute><DashboardLayout><PluginsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/members" element={<ProtectedRoute><DashboardLayout><MembersPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/plugins/new" element={<ProtectedRoute adminOnly><DashboardLayout><AdminPluginsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/plugins/:id" element={<ProtectedRoute adminOnly><DashboardLayout><AdminPluginsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/shops" element={<ProtectedRoute><DashboardLayout><ShopsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/shops/:id" element={<ProtectedRoute><DashboardLayout><ShopDetailPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/shops/new" element={<ProtectedRoute><DashboardLayout><AdminShopPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/shops/edit/:id" element={<ProtectedRoute><DashboardLayout><AdminShopPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/shops/:shopId/items/new" element={<ProtectedRoute><DashboardLayout><AdminShopItemPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/shops/:shopId/items/edit/:itemId" element={<ProtectedRoute><DashboardLayout><AdminShopItemPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><DashboardLayout><TransactionsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><DashboardLayout><EventsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><DashboardLayout><MessagesPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><DashboardLayout><NotificationsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute><DashboardLayout><PublicProfilePage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/rules" element={<ProtectedRoute><DashboardLayout><RulesPage /></DashboardLayout></ProtectedRoute>} />
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
