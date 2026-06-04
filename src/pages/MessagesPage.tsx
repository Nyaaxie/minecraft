import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { chatService } from '../services/chatService';
import { dbService } from '../services/dbService';
import { Search, Send, ArrowLeft, MoreVertical, MessageSquare, Plus, X, Trash2, User, Loader2, CheckCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Profile } from '../types/database.types';

// Optimistic message type — has a tempId before DB confirms
interface OptimisticMessage {
  id: string;
  tempId?: string;       // set while pending, cleared on confirm
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  status: 'sending' | 'sent' | 'error';
  sender?: { id: string; username: string; avatar_url: string | null };
}

// ── Animated typing dots ────────────────────────────────────────────────────
const TypingDots = () => (
  <div className="flex items-center gap-1 px-1 py-0.5">
    {[0, 1, 2].map(i => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-neutral-400 block"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

const MessagesPage = () => {
  const { profile: currentUser } = useAuthStore();
  const {
    conversations, messages, activeConversationId,
    setConversations, setMessages, setActiveConversationId,
    typingUsers, setTyping, unreadCounts, incrementUnreadCount,
  } = useChatStore();

  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [profileSearch, setProfileSearch] = useState('');
  const [startingChat, setStartingChat] = useState(false);

  // Optimistic messages layered on top of confirmed store messages
  const [optimisticMsgs, setOptimisticMsgs] = useState<OptimisticMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isNearBottomRef = useRef(true);

  // ── Scroll helpers ──────────────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distFromBottom < 80;
  }, []);

  // ── Load conversations ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const init = async () => {
      try {
        setActiveConversationId(null);
        const convs = await chatService.getConversations(currentUser.id);
        setConversations(convs);
      } catch {
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [currentUser, setConversations, setActiveConversationId]);

  // ── Global unread-count listener (other conversations) ──────────────────
  useEffect(() => {
    if (!currentUser) return;
    const sub = chatService.subscribeToAllMessages((msg) => {
      const activeId = useChatStore.getState().activeConversationId;
      if (msg.sender_id !== currentUser.id && msg.conversation_id !== activeId) {
        incrementUnreadCount(msg.conversation_id);
        const convName = conversations.find(c => c.id === msg.conversation_id)?.name || 'Chat';
        
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            onClick={() => {
              setActiveConversationId(msg.conversation_id);
              toast.dismiss(t.id);
            }}
            className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-neutral-900 shadow-2xl rounded-[1.5rem] pointer-events-auto flex items-center gap-4 p-4 border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:scale-[1.02] transition-transform`}
          >
            <div className="w-12 h-12 rounded-2xl bg-strawberry-500/10 flex items-center justify-center shrink-0">
              <MessageSquare className="text-strawberry-600" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-strawberry-600 mb-0.5">New Message</p>
              <p className="text-sm font-black italic uppercase tracking-tight text-neutral-900 dark:text-white truncate">
                {convName}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-bold">
                {msg.content}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
              className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </motion.div>
        ), { duration: 4000, position: 'bottom-right' });

        if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
          new Notification(`New message in ${convName}`, { body: msg.content });
        }
      }
    });
    return () => { sub.unsubscribe(); };
  }, [currentUser, conversations, incrementUnreadCount]);

  // ── Load messages + subscribe to active conversation ────────────────────
  useEffect(() => {
    if (!activeConversationId || !currentUser) return;

    // Clear optimistic layer on conversation switch
    setOptimisticMsgs([]);

    const loadMessages = async () => {
      try {
        const msgs = await chatService.getMessages(activeConversationId);
        setMessages(msgs);
        msgs.forEach((msg: any) => {
          if (msg.sender_id !== currentUser.id) {
            chatService.markMessageAsRead(msg.id, currentUser.id);
          }
        });
        setTimeout(() => scrollToBottom('auto'), 50);
      } catch {
        toast.error('Failed to load messages');
      }
    };
    loadMessages();

    // Real-time: incoming messages
    const msgSub = chatService.subscribeToMessages(activeConversationId, async (msg) => {
      if (msg.conversation_id !== activeConversationId) return;

      // The raw realtime payload has no `sender` join — attach it now.
      let msgWithSender: any = msg;
      if (msg.sender_id === currentUser.id) {
        msgWithSender = {
          ...msg,
          sender: {
            id: currentUser.id,
            username: currentUser.username || 'You',
            avatar_url: currentUser.avatar_url ?? null,
          },
        };
      } else {
        const existingWithSender = useChatStore.getState().messages.find(
          (m: any) => m.sender?.id === msg.sender_id
        );
        msgWithSender = {
          ...msg,
          sender: existingWithSender?.sender ?? { id: msg.sender_id, username: 'Player', avatar_url: null },
        };
      }

      // Remove matching optimistic placeholder, then add confirmed message atomically
      setOptimisticMsgs(prev => {
        const match = prev.find(
          m => m.content === msg.content && m.sender_id === msg.sender_id
        );
        setTimeout(() => {
          const existing = useChatStore.getState().messages;
          if (!existing.some((m: any) => m.id === msgWithSender.id)) {
            useChatStore.getState().setMessages([...existing, msgWithSender]);
          }
          if (isNearBottomRef.current) scrollToBottom();
        }, 0);
        return match ? prev.filter(m => m.tempId !== match.tempId) : prev;
      });

      if (msg.sender_id !== currentUser.id) {
        chatService.markMessageAsRead(msg.id, currentUser.id);
      }
    });

    // Real-time: deleted messages
    const delSub = chatService.subscribeToDeleteMessages(activeConversationId, (msgId) => {
      const updated = useChatStore.getState().messages.filter(m => m.id !== msgId);
      useChatStore.getState().setMessages(updated);
    });

    // Real-time: typing
    const typingSub = chatService.subscribeToTyping(activeConversationId, (payload) => {
      setTyping(payload.username, payload.isTyping);
    });

    return () => {
      msgSub.unsubscribe();
      delSub.unsubscribe();
      typingSub.unsubscribe();
    };
  }, [activeConversationId, currentUser, setMessages, setTyping, scrollToBottom]);

  // ── Auto-scroll when messages/typing change ─────────────────────────────
  useEffect(() => {
    if (isNearBottomRef.current) scrollToBottom();
  }, [messages.length, optimisticMsgs.length, typingUsers.length, scrollToBottom]);

  // ── Load profiles for new chat ──────────────────────────────────────────
  useEffect(() => {
    if (!showNewChat) return;
    dbService.getAllProfiles()
      .then(p => setAllProfiles(p.filter(x => x.id !== currentUser?.id)))
      .catch(() => toast.error('Failed to load users'));
  }, [showNewChat, currentUser]);

  // ── Send message (optimistic) ───────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !activeConversationId || !currentUser || !activeConv) return;

    const convData = activeConv as any;
    const receiver = convData.conversation_members?.find(
      (m: any) => m.profile_id !== currentUser.id
    );
    const receiverId = receiver?.profile_id;
    if (!receiverId) { toast.error('Could not find recipient'); return; }

    // Stop typing broadcast
    chatService.broadcastTyping(activeConversationId, currentUser.username || 'Someone', false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Create optimistic entry immediately
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimistic: OptimisticMessage = {
      id: tempId,
      tempId,
      conversation_id: activeConversationId,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      content: text,
      created_at: new Date().toISOString(),
      status: 'sending',
      sender: {
        id: currentUser.id,
        username: currentUser.username || 'You',
        avatar_url: currentUser.avatar_url ?? null,
      },
    };

    setOptimisticMsgs(prev => [...prev, optimistic]);
    setNewMessage('');
    scrollToBottom();
    inputRef.current?.focus();

    try {
      await chatService.sendMessage(activeConversationId, currentUser.id, receiverId, text);
      // Mark as sent — real-time subscription will remove it and add confirmed msg
      setOptimisticMsgs(prev =>
        prev.map(m => m.tempId === tempId ? { ...m, status: 'sent' } : m)
      );
    } catch {
      toast.error('Failed to send message');
      setOptimisticMsgs(prev =>
        prev.map(m => m.tempId === tempId ? { ...m, status: 'error' } : m)
      );
    }
  };

  // ── Typing broadcast ────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!activeConversationId || !currentUser) return;
    chatService.broadcastTyping(activeConversationId, currentUser.username || 'Someone', true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      chatService.broadcastTyping(activeConversationId, currentUser.username || 'Someone', false);
    }, 2000);
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await chatService.deleteMessage(messageId);
      const updated = useChatStore.getState().messages.filter(m => m.id !== messageId);
      useChatStore.getState().setMessages(updated);
    } catch {
      toast.error('Failed to delete message');
    }
  };

  // ── Start new chat ──────────────────────────────────────────────────────
  const handleStartChat = async (otherProfile: Profile) => {
    if (!currentUser) return;
    setStartingChat(true);
    try {
      const conv = await chatService.getOrCreateDirectConversation(
        currentUser.id, otherProfile.id, otherProfile.username || 'Chat'
      );
      const convs = await chatService.getConversations(currentUser.id);
      setConversations(convs);
      setActiveConversationId(conv.id);
      setShowNewChat(false);
      setProfileSearch('');
    } catch {
      toast.error('Failed to start conversation');
    } finally {
      setStartingChat(false);
    }
  };

  // ── Merge confirmed + optimistic messages ───────────────────────────────
  // Optimistic messages that haven't been replaced by confirmed ones yet
  const pendingOptimistic = optimisticMsgs.filter(
    opt => !messages.some(m => m.id === opt.id)
  );
  const allMessages = [...messages, ...pendingOptimistic].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const filteredProfiles = allProfiles.filter(p =>
    p.username?.toLowerCase().includes(profileSearch.toLowerCase()) ||
    p.minecraft_username?.toLowerCase().includes(profileSearch.toLowerCase())
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-14rem)] lg:h-[750px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-neutral-900/5 relative">
      <div className="flex flex-1 overflow-hidden">

        {/* ── Conversation List ── */}
        <div className={`w-full lg:w-96 border-r border-neutral-100 dark:border-white/5 flex flex-col transition-all duration-300 ${activeConversationId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 pb-3 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Messenger</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2.5 bg-strawberry-600 text-white rounded-xl hover:bg-strawberry-700 active:scale-95 transition-all shadow-md shadow-strawberry-600/20"
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
                <button onClick={() => setShowNewChat(true)} className="px-4 py-2 bg-strawberry-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[9px] shadow-md shadow-strawberry-600/20 active:scale-95 transition-all">
                  New Message
                </button>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeConversationId === conv.id ? 'bg-strawberry-600 text-white' : 'hover:bg-neutral-50 dark:hover:bg-white/5'}`}
                >
                  <div className="h-11 w-11 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-neutral-100 dark:border-neutral-700 shadow-sm">
                    {conv.avatar_url
                      ? <img src={conv.avatar_url} alt="" className="h-full w-full object-cover" />
                      : <MessageSquare size={20} className={activeConversationId === conv.id ? 'text-white' : 'text-neutral-400'} />
                    }
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-black italic uppercase tracking-tight text-sm truncate">{conv.name || 'Private Chat'}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${activeConversationId === conv.id ? 'text-white/60' : 'text-neutral-400'}`}>
                      Direct Message
                    </p>
                  </div>
                  {(unreadCounts[conv.id] ?? 0) > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-strawberry-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    >
                      {unreadCounts[conv.id] > 9 ? '9+' : unreadCounts[conv.id]}
                    </motion.span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className={`flex-1 flex flex-col bg-neutral-50/50 dark:bg-neutral-950/20 relative ${!activeConversationId ? 'hidden lg:flex items-center justify-center' : 'flex w-full h-full'}`}>
          {activeConversationId ? (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-neutral-100 dark:border-white/5 flex items-center gap-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
                <button onClick={() => setActiveConversationId(null)} className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div className="h-9 w-9 rounded-xl bg-strawberry-500/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {activeConv?.avatar_url
                    ? <img src={activeConv.avatar_url} alt="" className="h-full w-full object-cover" />
                    : <MessageSquare size={16} className="text-strawberry-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-black italic uppercase tracking-tight text-sm truncate">{activeConv?.name || 'Chat'}</h2>
                  <AnimatePresence mode="wait">
                    {typingUsers.length > 0 ? (
                      <motion.div
                        key="typing"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-1"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-strawberry-500 italic">
                          {typingUsers.join(', ')} typing
                        </span>
                        <TypingDots />
                      </motion.div>
                    ) : (
                      <motion.p
                        key="online"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] font-bold uppercase tracking-widest text-neutral-400"
                      >
                        Direct Message
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <button className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-neutral-400">
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-1 hide-scrollbar"
              >
                {allMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-14 h-14 bg-strawberry-500/10 rounded-3xl flex items-center justify-center mb-3">
                      <MessageSquare size={24} className="text-strawberry-600" />
                    </div>
                    <p className="font-black italic uppercase tracking-tighter text-neutral-400 text-sm">No messages yet</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 dark:text-neutral-600 mt-1">Say hello!</p>
                  </div>
                ) : (
                  allMessages.map((msg: any, i) => {
                    if (!msg?.id) return null;
                    const isOwn = msg.sender_id === currentUser?.id;
                    const isOptimistic = !!msg.tempId;
                    const status = msg.status as 'sending' | 'sent' | 'error' | undefined;

                    // Only show avatar for received messages (left side)
                    const senderAvatar = isOwn ? null : msg.sender?.avatar_url;
                    const senderName = isOwn ? null : (msg.sender?.username || 'Unknown');

                    // Group consecutive messages from same sender within 60s
                    const prevMsg = allMessages[i - 1] as any;
                    const isGrouped = prevMsg &&
                      prevMsg.sender_id === msg.sender_id &&
                      new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 60000;

                    // Show timestamp only on last in a group, or standalone
                    const nextMsg = allMessages[i + 1] as any;
                    const isLastInGroup = !nextMsg ||
                      nextMsg.sender_id !== msg.sender_id ||
                      new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() >= 60000;

                    return (
                      <motion.div
                        key={msg.tempId || msg.id}
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: status === 'error' ? 0.6 : 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group ${isGrouped ? 'mt-0.5' : 'mt-3'}`}
                      >
                        <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

                          {/* Avatar — only for received messages, invisible spacer when grouped */}
                          {!isOwn && (
                            <div className={`h-8 w-8 rounded-xl flex-shrink-0 overflow-hidden ${isGrouped ? 'invisible' : 'bg-neutral-200 dark:bg-neutral-800'}`}>
                              {!isGrouped && (
                                senderAvatar
                                  ? <img src={senderAvatar} alt={senderName || ''} className="h-full w-full object-cover" />
                                  : <div className="h-full w-full flex items-center justify-center"><User size={14} className="text-neutral-400" /></div>
                              )}
                            </div>
                          )}

                          <div
                            className={`px-4 py-2.5 rounded-2xl max-w-[90%] md:max-w-md relative text-sm font-medium break-words whitespace-pre-wrap
                              ${isOwn
                                ? `bg-strawberry-600 text-white ${isGrouped ? 'rounded-tr-md' : 'rounded-tr-2xl'} rounded-tl-2xl rounded-bl-2xl rounded-br-md`
                                : `bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white ${isGrouped ? 'rounded-tl-md' : 'rounded-tl-2xl'} rounded-tr-2xl rounded-br-2xl rounded-bl-md shadow-sm border border-neutral-100 dark:border-neutral-700`
                              }
                              ${isOptimistic && status === 'sending' ? 'opacity-60' : ''}
                            `}
                          >
                            {/* Sender name — only for received, only first in group */}
                            {!isOwn && !isGrouped && senderName && (
                              <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                                {senderName}
                              </p>
                            )}
                            {msg.content || ''}

                            {/* Delete button */}
                            {(currentUser?.role === 'admin' || isOwn) && !isOptimistic && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className={`absolute -top-2 ${isOwn ? '-left-7' : '-right-7'} p-1 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700`}
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Timestamp + status — only show on last message in group */}
                        {isLastInGroup && (
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'pr-1' : 'pl-10'}`}>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            {isOwn && (
                              <span>
                                {status === 'sending'
                                  ? <Clock size={10} className="text-neutral-300 animate-pulse" />
                                  : status === 'error'
                                    ? <span className="text-[9px] text-red-400 font-bold">!</span>
                                    : <CheckCheck size={10} className="text-strawberry-400" />
                                }
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}

                {/* Typing bubble */}
                <AnimatePresence>
                  {typingUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="flex items-end gap-2 mt-3"
                    >
                      <div className="h-8 w-8 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
                      <div className="px-4 py-3 bg-white dark:bg-neutral-800 rounded-2xl rounded-bl-md shadow-sm border border-neutral-100 dark:border-neutral-700">
                        <TypingDots />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-white/5 flex gap-2 items-end"
              >
                <input
                  ref={inputRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as any);
                    }
                  }}
                  className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-3 outline-none text-sm font-medium placeholder:text-neutral-400 resize-none"
                  placeholder="Type a message..."
                  autoComplete="off"
                />
                <motion.button
                  type="submit"
                  disabled={!newMessage.trim()}
                  whileTap={{ scale: 0.92 }}
                  className="p-3 bg-strawberry-600 text-white rounded-2xl disabled:opacity-40 transition-all shadow-md shadow-strawberry-600/20 shrink-0"
                >
                  <Send size={18} />
                </motion.button>
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

      {/* ── New Chat Modal ── */}
      <AnimatePresence>
        {showNewChat && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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