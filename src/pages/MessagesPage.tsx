import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { chatService } from '../services/chatService';
import { dbService } from '../services/dbService';
import { Search, Send, Loader2, ArrowLeft, MoreVertical, MessageSquare, Plus, X, Trash2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Profile } from '../types/database.types';

const MessagesPage = () => {
  const { profile: currentUser } = useAuthStore();
  const { conversations, messages, activeConversationId, setConversations, setMessages, addMessage, removeMessage, setActiveConversationId, typingUsers, setTyping, unreadCounts, incrementUnreadCount } = useChatStore();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [profileSearch, setProfileSearch] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations
  useEffect(() => {
    if (!currentUser) return;
    const init = async () => {
      try {
        const convs = await chatService.getConversations(currentUser.id);
        setConversations(convs);
      } catch (err) {
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [currentUser, setConversations]);

  // Load all profiles for new chat
  useEffect(() => {
    if (!showNewChat) return;
    const load = async () => {
      try {
        const profiles = await dbService.getAllProfiles();
        setAllProfiles(profiles.filter(p => p.id !== currentUser?.id));
      } catch {
        toast.error('Failed to load users');
      }
    };
    load();
  }, [showNewChat, currentUser]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversationId || !currentUser) return;

    const loadMessages = async () => {
      try {
        const msgs = await chatService.getMessages(activeConversationId);
        setMessages(msgs);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        toast.error('Failed to load messages');
      }
    };
    loadMessages();

    const msgSubscription = chatService.subscribeToMessages(activeConversationId, (msg) => {
      if (!msg.conversation_id) return;
      if (msg.sender_id !== currentUser.id && activeConversationId !== msg.conversation_id) {
        incrementUnreadCount(msg.conversation_id);
        const convName = conversations.find(c => c.id === msg.conversation_id)?.name || 'Chat';
        toast.success(`New message in ${convName}`);
      } else if (activeConversationId === msg.conversation_id) {
        addMessage(msg);
        scrollToBottom();
      }
    });

    const deleteSubscription = chatService.subscribeToDeleteMessages(activeConversationId, (msgId) => {
      removeMessage(msgId);
    });

    const typingSubscription = chatService.subscribeToTyping(activeConversationId, (payload) => {
      setTyping(payload.username, payload.isTyping);
    });

    return () => {
      msgSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  }, [activeConversationId, setMessages, addMessage, removeMessage, setTyping, currentUser, incrementUnreadCount, conversations]);

  const handleStartChat = async (otherProfile: Profile) => {
    if (!currentUser) return;
    setStartingChat(true);
    try {
      const conv = await chatService.getOrCreateDirectConversation(currentUser.id, otherProfile.id, otherProfile.username || 'Chat');
      const convs = await chatService.getConversations(currentUser.id);
      setConversations(convs);
      setActiveConversationId(conv.id);
      setShowNewChat(false);
      setProfileSearch('');
    } catch (err) {
      toast.error('Failed to start conversation');
    } finally {
      setStartingChat(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await chatService.deleteMessage(messageId);
      removeMessage(messageId);
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!activeConversationId || !currentUser) return;
    chatService.broadcastTyping(activeConversationId, currentUser.username || 'Someone', true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      chatService.broadcastTyping(activeConversationId, currentUser.username || 'Someone', false);
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId || !currentUser || sending) return;
    setSending(true);
    chatService.broadcastTyping(activeConversationId, currentUser.username || 'Someone', false);
    try {
      const msg = await chatService.sendMessage(activeConversationId, currentUser.id, newMessage.trim());
      addMessage(msg);
      setNewMessage('');
      scrollToBottom();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const filteredProfiles = allProfiles.filter(p =>
    p.username?.toLowerCase().includes(profileSearch.toLowerCase()) ||
    p.minecraft_username?.toLowerCase().includes(profileSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-14rem)] lg:h-[750px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-neutral-900/5 relative">
      <div className="flex flex-1 overflow-hidden">

        {/* Conversation List */}
        <div className={`w-full lg:w-96 border-r border-neutral-100 dark:border-white/5 flex flex-col transition-all duration-300 ${activeConversationId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 pb-3 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Messenger</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2.5 bg-strawberry-600 text-white rounded-xl hover:bg-strawberry-700 active:scale-95 transition-all shadow-md shadow-strawberry-600/20"
              title="New Message"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 hide-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-strawberry-600" size={28} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 bg-strawberry-500/10 rounded-3xl flex items-center justify-center mb-4">
                  <MessageSquare size={28} className="text-strawberry-600" />
                </div>
                <p className="font-black italic uppercase tracking-tighter text-neutral-400 text-sm mb-1">No conversations yet</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 dark:text-neutral-600 mb-4">Start chatting with other players</p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="px-4 py-2 bg-strawberry-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[9px] shadow-md shadow-strawberry-600/20 active:scale-95 transition-all"
                >
                  New Message
                </button>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeConversationId === conv.id
                    ? 'bg-strawberry-600 text-white'
                    : 'hover:bg-neutral-50 dark:hover:bg-white/5'
                    }`}
                >
                  <div className="h-11 w-11 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-neutral-100 dark:border-neutral-700 shadow-sm">
                    {conv.avatar_url ? (
                      <img src={conv.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <MessageSquare size={20} className={activeConversationId === conv.id ? 'text-white' : 'text-neutral-400'} />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-black italic uppercase tracking-tight text-sm truncate">{conv.name || 'Private Chat'}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${activeConversationId === conv.id ? 'text-white/60' : 'text-neutral-400'}`}>
                      Direct Message
                    </p>
                  </div>
                  {unreadCounts[conv.id] > 0 && (
                    <span className="bg-strawberry-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      {unreadCounts[conv.id]}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-neutral-50/50 dark:bg-neutral-950/20 relative ${!activeConversationId ? 'hidden lg:flex items-center justify-center' : 'flex w-full h-full'}`}>
          {activeConversationId ? (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-neutral-100 dark:border-white/5 flex items-center gap-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
                <button onClick={() => setActiveConversationId(null)} className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div className="h-9 w-9 rounded-xl bg-strawberry-500/10 flex items-center justify-center shrink-0">
                  <MessageSquare size={16} className="text-strawberry-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-black italic uppercase tracking-tight text-sm truncate">{activeConv?.name || 'Chat'}</h2>
                  {typingUsers.length > 0 && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-strawberry-600 italic">
                      {typingUsers.join(', ')} typing...
                    </p>
                  )}
                </div>
                <button className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-neutral-400">
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-14 h-14 bg-strawberry-500/10 rounded-3xl flex items-center justify-center mb-3">
                      <MessageSquare size={24} className="text-strawberry-600" />
                    </div>
                    <p className="font-black italic uppercase tracking-tighter text-neutral-400 text-sm">No messages yet</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 dark:text-neutral-600 mt-1">Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg: any) => {
                    if (!msg || !msg.id) return null; // Defensive check
                    const isOwn = msg.sender_id === currentUser?.id;
                    const senderAvatar = isOwn ? currentUser?.avatar_url : msg.sender?.avatar_url;
                    const senderName = isOwn ? (currentUser?.username || 'You') : (msg.sender?.username || 'Unknown');
                    
                    return (
                      <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group`}>
                        <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar - Displayed for both sender and receiver */}
                          <div className="h-8 w-8 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 overflow-hidden shadow-sm">
                            {senderAvatar ? (
                              <img src={senderAvatar} alt={senderName} className="h-full w-full object-cover" />
                            ) : (
                              <User size={16} className="m-auto text-neutral-400" />
                            )}
                          </div>
                          
                          <div className={`px-4 py-3 rounded-3xl max-w-[85%] sm:max-w-[70%] relative text-sm font-medium break-words whitespace-pre-wrap ${isOwn
                            ? 'bg-strawberry-600 text-white rounded-br-lg'
                            : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-lg shadow-sm border border-neutral-100 dark:border-neutral-700'
                            }`}>
                            {/* Username - Displayed for both sender and receiver */}
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isOwn ? 'text-white/70' : 'text-neutral-500 dark:text-neutral-400'}`}>
                              {senderName}
                            </p>
                            
                            {msg.content || ''}
                            {(currentUser?.role === 'admin' || isOwn) && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className={`absolute -top-2 ${isOwn ? '-left-6' : '-right-6'} p-1 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 bg-white dark:bg-neutral-800 rounded-lg shadow-sm`}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest text-neutral-400 mt-1 ${isOwn ? 'px-10' : 'px-10'}`}>
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-white/5 flex gap-2">
                <input
                  value={newMessage}
                  onChange={handleInputChange}
                  className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-3 outline-none text-sm font-medium placeholder:text-neutral-400"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-3 bg-strawberry-600 text-white rounded-2xl disabled:opacity-50 active:scale-95 transition-all shadow-md shadow-strawberry-600/20"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center px-6">
              <div className="w-16 h-16 bg-strawberry-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-strawberry-600" />
              </div>
              <p className="font-black italic uppercase tracking-tighter text-neutral-400">Select a conversation</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 dark:text-neutral-600 mt-1">or start a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10"
              onClick={() => setShowNewChat(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute inset-x-4 top-16 bottom-16 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-sm z-20 bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200 dark:border-white/5"
            >
              <div className="p-5 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="font-black italic uppercase tracking-tighter">New Message</h3>
                <button onClick={() => setShowNewChat(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-neutral-400">
                  <X size={18} />
                </button>
              </div>
              <div className="p-3 border-b border-neutral-100 dark:border-white/5">
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-3 py-2">
                  <Search size={14} className="text-neutral-400 shrink-0" />
                  <input
                    autoFocus
                    value={profileSearch}
                    onChange={e => setProfileSearch(e.target.value)}
                    placeholder="Search players..."
                    className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-neutral-400"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
                {filteredProfiles.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="font-black italic uppercase tracking-tighter text-neutral-400 text-sm">No players found</p>
                  </div>
                ) : (
                  filteredProfiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleStartChat(p)}
                      disabled={startingChat}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-white/5 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <div className="h-10 w-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                        {p.avatar_url
                          ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                          : <span className="text-xs font-black text-neutral-400 uppercase">{p.username?.[0]}</span>
                        }
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-black italic uppercase tracking-tight text-sm truncate">{p.username}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 truncate">{p.minecraft_username || p.role}</p>
                      </div>
                      <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${p.role === 'admin' ? 'bg-strawberry-500/10 text-strawberry-600' : 'bg-neutral-100 dark:bg-white/5 text-neutral-400'}`}>
                        {p.role}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {startingChat && (
                <div className="p-4 border-t border-neutral-100 dark:border-white/5 flex items-center justify-center gap-2 text-neutral-400">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Starting chat...</span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagesPage;