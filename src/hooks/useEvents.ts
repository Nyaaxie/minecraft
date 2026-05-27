import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Event } from '../types/database.types';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_rsvps(count)
        `)
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      const processedEvents = (data || []).map(event => ({
        ...event,
        rsvpCount: (event as any).event_rsvps?.[0]?.count || 0
      }));

      setEvents(processedEvents);
    } catch (err: any) {
      console.error('useEvents Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Subscribe to changes with a unique channel name to avoid collisions
    const channelId = `events-changes:${Math.random().toString(36).substring(7)}`;
    const subscription = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { events, loading, error, refetch: fetchEvents };
};
