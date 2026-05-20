import { supabase } from './supabase';
import type { Event, EventRSVP, Profile, Announcement } from '../types/database.types';

export const dbService = {
  // --- Events ---
  async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*, profiles(username)')
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createEvent(event: Omit<Event, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('events').insert(event).select().single();
    if (error) throw error;
    return data;
  },

  async updateEvent(id: string, updates: Partial<Event>) {
    const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteEvent(id: string) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  },

  // --- RSVPs ---
  async getRSVPs(eventId: string) {
    const { data, error } = await supabase.from('event_rsvps').select('*, profiles(username, avatar_url)').eq('event_id', eventId);
    if (error) throw error;
    return data;
  },

  async upsertRSVP(eventId: string, profileId: string, status: EventRSVP['status']) {
    const { data, error } = await supabase
      .from('event_rsvps')
      .upsert({ event_id: eventId, profile_id: profileId, status })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Messages ---
  async getMessages(userId: string, otherUserId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async sendMessage(senderId: string, receiverId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: senderId, receiver_id: receiverId, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Notifications ---
  async getNotifications(profileId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async markNotificationRead(id: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },

  // --- Profiles & Admin ---
  async getAllProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').order('username', { ascending: true });
    if (error) throw error;
    return data;
  },

  async updateProfile(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // --- Announcements ---
  async getAnnouncements() {
    const { data, error } = await supabase.from('announcements').select('*, profiles(username)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('announcements').insert(announcement).select().single();
    if (error) throw error;
    return data;
  }
};
