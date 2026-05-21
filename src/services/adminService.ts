import { supabase } from './supabase';
import type { Rule, Reminder, MinecraftVersion } from '../types/database.types';

export const adminService = {
  // --- Rules ---
  async getRules() {
    const { data, error } = await supabase.from('rules').select('*').order('priority', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createRule(rule: Omit<Rule, 'id' | 'updated_at'>) {
    const { data, error } = await supabase.from('rules').insert(rule).select().single();
    if (error) throw error;
    return data;
  },

  async updateRule(id: string, updates: Partial<Rule>) {
    const { data, error } = await supabase.from('rules').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteRule(id: string) {
    const { error } = await supabase.from('rules').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Reminders ---
  async getReminders() {
    const { data, error } = await supabase.from('reminders').select('*').order('scheduled_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createReminder(reminder: Omit<Reminder, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('reminders').insert(reminder).select().single();
    if (error) throw error;
    return data;
  },

  async deleteReminder(id: string) {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Versions ---
  async getVersions() {
    const { data, error } = await supabase.from('minecraft_versions').select('*').order('version_string', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createVersion(version: Omit<MinecraftVersion, 'id' | 'updated_at'>) {
    const { data, error } = await supabase.from('minecraft_versions').insert(version).select().single();
    if (error) throw error;
    return data;
  },

  async updateVersion(id: string, updates: Partial<MinecraftVersion>) {
    const { data, error } = await supabase.from('minecraft_versions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
};
