import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { chatService } from '../services/chatService';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import type { Profile } from '../types/database.types';

const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-neutral-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-strawberry-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-neutral-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading StrawberrySMP...</p>
    </div>
  </div>
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setUser, setProfile, setLoading, user } = useAuthStore();
  const { incrementUnreadCount } = useChatStore();
  const [initialized, setInitialized] = useState(false);
  const initializedRef = useRef(false);

  // ── Fetch profile helper (reused in both init and auth-change listener) ──
  const fetchAndSetProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !profile) {
        console.warn('AuthProvider: Profile not found in database.');
        setProfile(null);
        return null;
      }

      setProfile(profile as Profile);
      return profile;
    } catch (err) {
      console.error('AuthProvider: Profile fetch error', err);
      setProfile(null);
      return null;
    }
  }, [setProfile]);

  // ── Update online status ─────────────────────────────────────────────
  const updateStatus = useCallback(async (status: 'online' | 'offline') => {
    if (!user?.id) return;
    try {
      await supabase
        .from('profiles')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);
    } catch (err) {
      console.error('AuthProvider: status update error', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      updateStatus('online');

      // Set offline when the tab is closed or user navigates away
      const handleBeforeUnload = () => {
        updateStatus('offline');
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        updateStatus('offline');
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [user, updateStatus]);

  useEffect(() => {
    // ── 1. Auth state change listener ────────────────────────────────────
    // Fires on: tab focus (token refresh), sign-in, sign-out, SIGNED_IN on return
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: auth event', event);

      // During first load, initializeAuth() handles everything — skip here
      // to avoid a race between the listener and the initial getSession call.
      if (!initializedRef.current) return;

      if (session) {
        setUser(session.user);
        // TOKEN_REFRESHED fires when the tab gets focus after being away.
        // Re-fetch the profile in case it changed while the tab was away.
        try {
          await fetchAndSetProfile(session.user.id);
        } catch (err) {
          console.error('AuthProvider: profile re-fetch error', err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    // ── 2. Initial auth check ────────────────────────────────────────────
    // Use getSession() with a race against a short timeout so a hung network
    // never leaves the user staring at the loading screen forever.
    const initializeAuth = async () => {
      try {
        // 6-second timeout — if Supabase hangs (bad connection, cold start),
        // we resolve with null and let the user see the login page instead of
        // being stuck on the spinner.
        const timeout = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 6000)
        );

        const sessionResult = await Promise.race([
          supabase.auth.getSession().then(r => r.data.session),
          timeout,
        ]);

        if (sessionResult) {
          setUser(sessionResult.user);

          // Fetch profile + unread counts in parallel
          const [, unreadRes] = await Promise.all([
            fetchAndSetProfile(sessionResult.user.id),
            chatService.getUnreadCounts(sessionResult.user.id).catch(() => null),
          ]);

          if (unreadRes) {
            Object.entries(unreadRes).forEach(([convId, count]) => {
              useChatStore.getState().setUnreadCount(convId, count as number);
            });
          }
        }
      } catch (error) {
        console.error('AuthProvider: init error', error);
      } finally {
        // Always unblock the UI — even if everything failed
        initializedRef.current = true;
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setLoading, fetchAndSetProfile]);

  // ── Global message listener for unread badges + browser notifications ──
  // Kept here (not in MessagesPage) so it works even when the user is on
  // another page entirely.
  useEffect(() => {
    if (!user) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const sub = chatService.subscribeToAllMessages(async (msg) => {
      if (!msg.conversation_id || msg.sender_id === user.id) return;

      // Check membership without a DB round-trip by reading from the chat store first
      const { conversations } = useChatStore.getState();
      const isInConversation = conversations.some(c => c.id === msg.conversation_id);

      // Fallback to DB check if conversations haven't loaded yet
      let isMember = isInConversation;
      if (!isMember) {
        const { data: members } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('conversation_id', msg.conversation_id)
          .eq('profile_id', user.id);
        isMember = !!(members && members.length > 0);
      }

      if (!isMember) return;

      const activeId = useChatStore.getState().activeConversationId;
      // Only count unread if the user isn't currently viewing that conversation
      if (msg.conversation_id !== activeId) {
        useChatStore.getState().incrementUnreadCount(msg.conversation_id);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Message', { body: msg.content || 'You have a new message' });
        }
      }
    });

    return () => { sub.unsubscribe(); };
  }, [user, incrementUnreadCount]);

  if (!initialized) return <LoadingScreen />;

  return <>{children}</>;
};