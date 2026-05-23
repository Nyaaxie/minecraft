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
  const initializedRef = useRef(false); // Gatekeeper for initialization

  useEffect(() => {
    // 1. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('--- Auth Event Received ---', event);

      // If we haven't finished the initial getSession check, ignore this
      if (!initializedRef.current) return; 

      if (session) {
        setUser(session.user);
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            if (profile) setProfile(profile as Profile);
        } catch (err) {
            console.error('AuthProvider: Listener profile fetch error', err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    // 2. Initial Auth Check
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setProfile(profile as Profile);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        initializedRef.current = true; // Mark as initialized
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setLoading]);

  if (!initialized) return <LoadingScreen />;

  return <>{children}</>;
};
