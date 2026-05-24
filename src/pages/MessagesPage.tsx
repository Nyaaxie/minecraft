import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { dbService } from '../services/dbService';
import { supabase } from '../services/supabase';
import type { Message, Profile } from '../types/database.types';
import {
  Send,
  User,
  Search,
  MessageSquare,
  Loader2,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const MessagesPage = () => {
  const { profile: currentUser } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await dbService.getAllProfiles();
        setProfiles(data.filter(p => p.id !== currentUser?.id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedProfile || !currentUser) return;

    const fetchMessages = async () => {
      try {
        const data = await dbService.getMessages(currentUser.id, selectedProfile.id);
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();

    // Real-time subscription for messages
    const subscription = supabase
      .channel(`messages:${currentUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUser.id}`
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === selectedProfile.id) {
          setMessages(prev => [...prev, msg]);
          setTimeout(scrollToBottom, 100);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedProfile, currentUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedProfile || !currentUser || sending) return;

    setSending(true);
    try {
      const msg = await dbService.sendMessage(currentUser.id, selectedProfile.id, newMessage.trim());
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.minecraft_username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] lg:h-[750px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-neutral-900/5 relative">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Profile List */}
        <div className={`w-full lg:w-96 border-r border-neutral-100 dark:border-white/5 flex flex-col transition-all duration-300 ${selectedProfile ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-8 pb-4">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-6">Messages</h1>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-strawberry-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-100 dark:bg-neutral-800/50 border border-transparent focus:border-strawberry-500/30 rounded-2xl py-4 pl-12 pr-6 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-neutral-50 dark:bg-white/5 rounded-2xl animate-pulse" />)
            ) : filteredProfiles.map((p) => (
              <motion.button
                whileHover={{ x: 4 }}
                key={p.id}
                onClick={() => setSelectedProfile(p)}
                className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all relative overflow-hidden group ${selectedProfile?.id === p.id
                  ? 'bg-strawberry-600 text-white shadow-lg shadow-strawberry-600/30'
                  : 'hover:bg-neutral-50 dark:hover:bg-white/5'
                  }`}
              >
                <div className="relative">
                  <div className={`h-12 w-12 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 flex items-center justify-center overflow-hidden border-2 ${selectedProfile?.id === p.id ? 'border-white/20' : 'border-white dark:border-neutral-900 shadow-sm'}`}>
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User size={24} className={selectedProfile?.id === p.id ? 'text-white' : 'text-neutral-500'} />
                    )}
                  </div>
                  {p.status === 'online' && (
                    <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-black italic uppercase tracking-tight text-sm truncate">{p.username}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedProfile?.id === p.id ? 'text-strawberry-100' : 'text-neutral-500'}`}>
                    {p.status === 'online' ? 'Online' : 'Offline'}
                  </p>
                </div>
                {selectedProfile?.id !== p.id && (
                  <MessageSquare size={16} className="text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-neutral-50/50 dark:bg-neutral-950/20 relative ${!selectedProfile ? 'hidden lg:flex items-center justify-center' : 'flex'}`}>
          {selectedProfile ? (
            <>
              {/* Chat Header */}
              <div className="p-6 lg:p-8 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedProfile(null)}
                    className="lg:hidden p-3 bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all active:scale-90"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-neutral-200 dark:bg-neutral-800 border-2 border-white dark:border-neutral-900 shadow-md flex items-center justify-center overflow-hidden">
                      {selectedProfile.avatar_url ? (
                        <img src={selectedProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User size={24} />
                      )}
                    </div>
                    {selectedProfile.status === 'online' && (
                      <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm" />
                    )}
                  </div>
                  <div>
                    <p className="font-black italic uppercase tracking-tighter text-lg leading-tight">{selectedProfile.username}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-strawberry-600">
                      {selectedProfile.status === 'online' ? 'Connected' : 'Offline'}
                    </p>
                  </div>
                </div>
                <button className="p-3 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl text-neutral-400 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 hide-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                    <div className="w-16 h-16 rounded-3xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-4">
                      <MessageSquare size={32} className="text-neutral-400" />
                    </div>
                    <p className="font-bold text-sm uppercase tracking-widest italic">Start your journey</p>
                    <p className="text-xs text-neutral-500 mt-1 uppercase tracking-tight">Say hello to {selectedProfile.username}!</p>
                  </div>
                ) : messages.map((msg) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={msg.id}
                    className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] md:max-w-[70%] group relative ${msg.sender_id === currentUser?.id ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 lg:p-5 rounded-[2rem] text-sm shadow-sm ${msg.sender_id === currentUser?.id
                        ? 'bg-strawberry-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-white/5 text-neutral-900 dark:text-neutral-200 rounded-tl-none'
                        }`}>
                        <p className="leading-relaxed font-medium">{msg.content}</p>
                      </div>
                      <p className={`text-[9px] font-bold uppercase tracking-widest mt-2 px-2 opacity-40 ${msg.sender_id === currentUser?.id ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Input Area */}
              <div className="p-6 lg:p-8 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-white/5">
                <form onSubmit={handleSend} className="flex gap-3 items-center bg-neutral-100 dark:bg-neutral-800/50 p-2 rounded-[2rem] border border-transparent focus-within:border-strawberry-500/20 focus-within:bg-white dark:focus-within:bg-neutral-800 transition-all">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-transparent border-none py-3 px-4 text-sm focus:ring-0 outline-none text-neutral-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-4 bg-strawberry-600 text-white rounded-3xl hover:bg-strawberry-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-strawberry-600/30 flex-shrink-0 active:scale-95"
                  >
                    {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center p-12 lg:p-20">
              <div className="mx-auto w-24 h-24 rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-white/5 shadow-xl flex items-center justify-center text-strawberry-600 mb-8 transform rotate-3">
                <MessageSquare size={40} />
              </div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-neutral-900 dark:text-white">Your Messenger</h3>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto text-sm font-medium uppercase tracking-tight leading-relaxed">
                Connect with the community. Select a player from the list to start a real-time conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
