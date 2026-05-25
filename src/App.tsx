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
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
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

import DashboardLayout from './components/DashboardLayout';

const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-neutral-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-strawberry-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-neutral-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading StrawberrySMP...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, profile, loading, signOut } = useAuthStore();
  
  console.log('ProtectedRoute state:', { hasUser: !!user, hasProfile: !!profile, loading });
  
  // 1. Wait for auth to finish loading
  if (loading) return <LoadingScreen />;
  
  // 2. If no user, definitely go to login
  if (!user) return <Navigate to="/login" replace />;
  
  // 3. If user is logged in, but profile isn't loaded yet, we need to check if it's still loading or if it failed
  if (!profile) {
    // If we've finished initializing but still have no profile, it means the profile doesn't exist (DB Reset?)
    // To prevent infinite hang, sign out and redirect to home.
    setTimeout(() => {
      if (!profile) {
        console.error('ProtectedRoute: Profile missing for user. Signing out to clear session.');
        signOut();
      }
    }, 2000);
    return <LoadingScreen />;
  }
  
  // 4. Now that we have a user and profile, check roles
  if (adminOnly && profile.role !== 'admin') return <Navigate to="/dashboard" replace />;
  
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
