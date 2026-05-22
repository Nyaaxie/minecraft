import React, { Suspense, lazy } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/useAuthStore';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Lazy load pages for performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
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
  const { user, profile, loading } = useAuthStore();
  
  console.log('ProtectedRoute: loading', loading, 'user', !!user);

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
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#171717', color: '#fff' } }} />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
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
            <Route path="/plugins" element={<ProtectedRoute><DashboardLayout><PluginsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/plugins/new" element={<ProtectedRoute adminOnly><DashboardLayout><AdminPluginsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/plugins/:id" element={<ProtectedRoute adminOnly><DashboardLayout><AdminPluginsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/shops" element={<ProtectedRoute><DashboardLayout><ShopsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/shops/:id" element={<ProtectedRoute><DashboardLayout><ShopDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/shops/new" element={<ProtectedRoute><DashboardLayout><AdminShopPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/shops/edit/:id" element={<ProtectedRoute><DashboardLayout><AdminShopPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/shops/:shopId/items/new" element={<ProtectedRoute><DashboardLayout><AdminShopItemPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/shops/:shopId/items/edit/:itemId" element={<ProtectedRoute><DashboardLayout><AdminShopItemPage /></DashboardLayout></ProtectedRoute>} />
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
