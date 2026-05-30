import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { MinecraftVersion } from '../types/database.types';

export const useMinecraftVersions = () => {
  const [versions, setVersions] = useState<MinecraftVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('minecraft_versions')
        .select('*')
        .order('version_string', { ascending: false });

      if (error) throw error;
      setVersions(data);
    } catch (err: any) {
      console.error('Error fetching Minecraft versions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();

    const channelId = `minecraft-versions:${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'minecraft_versions' },
        (_payload) => {
          fetchVersions(); // Refetch all versions on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { versions, loading, error, refetch: fetchVersions };
};
