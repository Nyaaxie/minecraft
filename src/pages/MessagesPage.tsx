import React, { useState, useEffect, useRef } from 'react';
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
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.minecraft_username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden text-neutral-900 dark:text-neutral-100">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col ${selectedProfile ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input 
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-strawberry-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl animate-pulse" />)
          ) : filteredProfiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProfile(p)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedProfile?.id === p.id ? 'bg-strawberry-600 text-white' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-bold truncate text-sm">{p.username}</p>
                <p className={`text-xs truncate ${selectedProfile?.id === p.id ? 'text-strawberry-100' : 'text-neutral-500'}`}>
                  {p.status === 'online' ? 'Online' : 'Offline'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-900/50 ${!selectedProfile ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {selectedProfile ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="md:hidden p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
                  {selectedProfile.avatar_url ? (
                    <img src={selectedProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">{selectedProfile.username}</p>
                  <p className="text-xs text-neutral-500">{selectedProfile.status === 'online' ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <button className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] md:max-w-[60%] p-3 rounded-2xl text-sm ${
                    msg.sender_id === currentUser?.id 
                      ? 'bg-strawberry-600 text-white rounded-tr-none' 
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 rounded-tl-none'
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 opacity-50 ${msg.sender_id === currentUser?.id ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm focus:border-strawberry-500 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-strawberry-600 text-white rounded-xl hover:bg-strawberry-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-strawberry-600/20"
                >
                  {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center p-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-600 mb-4">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Your Messenger</h3>
            <p className="text-neutral-500 max-w-xs mx-auto">Select a player from the list to start a real-time conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
