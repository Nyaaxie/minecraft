import { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import type { Profile } from '../types/database.types';

// Importing LoadingScreen to prevent blank screen
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-neutral-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-strawberry-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-neutral-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading StrawberrySMP...</p>
    </div>
  </div>
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setUser, setProfile, setLoading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  const initializedRef = useRef(false); // Lock for Strict Mode

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeAuth = async () => {
      console.log('AuthProvider: Starting initialization...');
      const startTime = performance.now();
      
      try {
        // 1. Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log(`AuthProvider: Session fetched. Existing session: ${!!session}`);
        
        // ONLY update if store is empty or session actually changed
        if (session) {
          // If we already have a user in the store (from manual login), skip the setUser call to avoid flicker
          const currentUser = useAuthStore.getState().user;
          if (!currentUser || currentUser.id !== session.user.id) {
            setUser(session.user);
          }

          const profileStartTime = performance.now();
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          console.log(`AuthProvider: Profile fetched in ${Math.round(performance.now() - profileStartTime)}ms`);
          
          if (profile) {
            setProfile(profile as Profile);
            supabase.from('profiles').update({ status: 'online' }).eq('id', session.user.id).then(() => {
                console.log('AuthProvider: Status updated to online');
            });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
        console.log(`AuthProvider: Initialization complete. Total time: ${Math.round(performance.now() - startTime)}ms`);
      }
    };

    initializeAuth();
// 2. Auth State Change Listener
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('--- Auth Event Received ---', event);
  console.log('Session data:', !!session);
  console.log('Session object:', session); // Log the session object itself to inspect

  if (event === 'SIGNED_OUT' || !session) {
    console.log('AuthProvider: Clearing user/profile due to sign out or no session');
    setUser(null);
    setProfile(null);
    return;
  }

  setLoading(true); // START LOADING
  setUser(session.user);
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
  console.log('Profile fetched in state change:', !!profile);
  if (profile) setProfile(profile as Profile);
  setLoading(false); // END LOADING
});    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setLoading]);

  if (!initialized) return <LoadingScreen />;

  return <>{children}</>;
};
