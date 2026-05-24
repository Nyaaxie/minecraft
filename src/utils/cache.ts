const CACHE_TTL = 60 * 1000; // 60 seconds

export const cache = {
  get: <T>(key: string): T | null => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  },
  set: <T>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  }
};
