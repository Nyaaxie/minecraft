import { create } from 'zustand';
import type { Message, Conversation } from '../types/database.types';

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  activeConversationId: string | null;
  typingUsers: string[];
  unreadCounts: Record<string, number>;
  setConversations: (convs: Conversation[]) => void;
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  removeMessage: (msgId: string) => void;
  setActiveConversationId: (id: string | null) => void;
  setTyping: (username: string, isTyping: boolean) => void;
  setUnreadCount: (convId: string, count: number) => void;
  incrementUnreadCount: (convId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: [],
  activeConversationId: null,
  typingUsers: [],
  unreadCounts: {},
  setConversations: (conversations) => set({ conversations }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  removeMessage: (msgId) => set((state) => ({ messages: state.messages.filter(m => m.id !== msgId) })),
  setActiveConversationId: (id) => set((state) => ({
    activeConversationId: id,
    messages: [],
    unreadCounts: id ? { ...state.unreadCounts, [id]: 0 } : state.unreadCounts
  })),
  setTyping: (username, isTyping) => set((state) => ({
    typingUsers: isTyping
      ? [...new Set([...state.typingUsers, username])]
      : state.typingUsers.filter(u => u !== username)
  })),
  setUnreadCount: (convId, count) => set((state) => ({
    unreadCounts: { ...state.unreadCounts, [convId]: count }
  })),
  incrementUnreadCount: (convId) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [convId]: (state.unreadCounts[convId] || 0) + 1
    }
  })),
}));