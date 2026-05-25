import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import type { Profile } from '../types/database.types';

export const useAuth = () => {
  const { setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // 1. Initialize Auth Session
    const initializeAuth = async () => {
      console.log('Auth: Initializing...');
      
      // Add a timeout promise to detect if getSession hangs
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth initialization timed out')), 5000)
      );

      try {
        const getSessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([getSessionPromise, timeout]) as any;
        console.log('Auth: Session found', !!session);
        
        if (session) {
          setUser(session.user);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) setProfile(profile as Profile);
          
          await supabase.from('profiles').update({ status: 'online' }).eq('id', session.user.id);
        } else {
          console.log('Auth: No session');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (import.meta.env.DEV) console.log('Auth: Setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) setProfile(profile as Profile);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setLoading]);
};
