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

    const channel = supabase
      .channel('public:minecraft_versions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'minecraft_versions' },
        (_payload) => {
          // console.log('Change received!', payload);
          fetchVersions(); // Refetch all versions on any change
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { versions, loading, error, refetch: fetchVersions };
};
