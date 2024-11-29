interface CacheData<T> {
  timestamp: number;
  data: T;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export function getCachedData<T>(key: string): T | null {
  try {
    const cachedData = localStorage.getItem(key);
    if (!cachedData) {
      return null;
    }

    const cache: CacheData<T> = JSON.parse(cachedData);
    const now = Date.now();
    
    // Check if cache is expired (older than 7 days)
    if (now - cache.timestamp > SEVEN_DAYS_MS) {
      localStorage.removeItem(key);
      return null;
    }
    
    return cache.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    const cacheData: CacheData<T> = {
      timestamp: Date.now(),
      data
    };
    
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}