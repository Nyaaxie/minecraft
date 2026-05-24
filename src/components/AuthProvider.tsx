import { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { chatService } from '../services/chatService';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
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
  const { setUser, setProfile, setLoading, user } = useAuthStore();
  const { incrementUnreadCount } = useChatStore();
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

  // Global chat notification listener
  useEffect(() => {
    if (!user) return;

    // Request permission immediately if it's default
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const sub = chatService.subscribeToAllMessages(async (msg) => {
      console.log('AuthProvider: GLOBAL LISTENER - Received message object:', msg);
      
      if (!user) return;

      // Extract details. Note: payload structure might vary
      const conversationId = msg.conversation_id;
      const senderId = msg.sender_id;
      const receiverId = msg.receiver_id;

      console.log('AuthProvider: Extracted IDs:', { conversationId, senderId, receiverId, currentUserId: user.id });

      if (!conversationId) {
        console.warn('AuthProvider: Message received but conversation_id is missing!');
      }

      // Verify membership
      const { data: members } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('conversation_id', conversationId)
        .eq('profile_id', user.id);

      const isMember = members && members.length > 0;
      const isSender = senderId === user.id;

      if (isMember && !isSender) {
        console.log('AuthProvider: Global notification trigger!');
        incrementUnreadCount(conversationId);
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Message', { body: msg.content || 'You have a new message' });
        }
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, [user, incrementUnreadCount]);

  if (!initialized) return <LoadingScreen />;

  return <>{children}</>;
};
