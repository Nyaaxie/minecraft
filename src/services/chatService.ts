import { supabase } from './supabase';
import type { Message } from '../types/database.types';

export const chatService = {
  // Fetch all conversations for the current user
  async getConversations(profileId: string) {
    // 1. Get the conversation IDs the user is a member of
    const { data: memberData, error: memberError } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('profile_id', profileId);

    if (memberError) throw memberError;
    if (!memberData || memberData.length === 0) return [];

    const convIds = memberData.map(m => m.conversation_id);

    // 2. Fetch conversations and include all their members and profiles
    const { data: convs, error: convError } = await supabase
      .from('conversations')
      .select(`
        id, 
        name, 
        is_group, 
        updated_at,
        conversation_members(
          profile_id,
          profiles(username)
        )
      `)
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (convError) throw convError;
    if (!convs) return [];

    // 3. Process the data to set the correct display name
    return convs.map((conv: any) => {
      let displayName = conv.name;

      // If it's a private chat, set the name to the other participant's username
      if (!conv.is_group) {
        const otherMember = conv.conversation_members.find(
          (m: any) => m.profile_id !== profileId
        );
        if (otherMember?.profiles?.username) {
          displayName = otherMember.profiles.username;
        }
      }
      
      return {
        ...conv,
        name: displayName
      };
    });
  },
// Fetch messages for a specific conversation
async getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    // Explicitly specify the foreign key column 'sender_id' for the join
    .select('*, sender:profiles!sender_id(id, username, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Supabase Error in getMessages:", error);
    throw error;
  }

  console.log("Supabase Data in getMessages:", data);
  return data || [];
},

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  },

  async getOrCreateDirectConversation(currentUserId: string, otherUserId: string, otherUsername: string) {
    const { data: myConvs } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('profile_id', currentUserId);

    if (myConvs && myConvs.length > 0) {
      const myConvIds = myConvs.map(m => m.conversation_id);
      const { data: shared } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('profile_id', otherUserId)
        .in('conversation_id', myConvIds);

      if (shared && shared.length > 0) {
        const { data: existing } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', shared[0].conversation_id)
          .eq('is_group', false)
          .single();
        if (existing) return existing;
      }
    }

    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ name: otherUsername, is_group: false })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, profile_id: currentUserId },
      { conversation_id: conv.id, profile_id: otherUserId },
    ]);

    return conv;
  },

  subscribeToMessages(conversationId: string, onMessage: (message: Message) => void) {
    return supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => onMessage(payload.new as Message))
      .subscribe();
  },

  subscribeToDeleteMessages(conversationId: string, onMessageDeleted: (messageId: string) => void) {
    return supabase
      .channel(`chat:delete:${conversationId}`)
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => onMessageDeleted(payload.old.id))
      .subscribe();
  },

  broadcastTyping(conversationId: string, username: string, isTyping: boolean) {
    return supabase.channel(`chat:${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { username, isTyping }
    });
  },

  subscribeToTyping(conversationId: string, onTyping: (payload: { username: string, isTyping: boolean }) => void) {
    return supabase
      .channel(`chat:typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => onTyping(payload.payload))
      .subscribe();
  },
};