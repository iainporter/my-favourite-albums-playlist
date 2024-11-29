import fs from 'fs';
import path from 'path';

interface CacheData<T> {
  timestamp: number;
  data: T;
}

interface CacheStrategy {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T): void;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

class InMemoryCache implements CacheStrategy {
  private cache: Map<string, CacheData<any>> = new Map();

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > SEVEN_DAYS_MS) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set<T>(key: string, data: T): void {
    const cacheData: CacheData<T> = {
      timestamp: Date.now(),
      data
    };
    this.cache.set(key, cacheData);
  }
}

class FileCache implements CacheStrategy {
  private CACHE_DIR = path.join(process.cwd(), '.cache');

  private ensureCacheDirectory() {
    if (!fs.existsSync(this.CACHE_DIR)) {
      fs.mkdirSync(this.CACHE_DIR, { recursive: true });
    }
  }

  get<T>(key: string): T | null {
    try {
      this.ensureCacheDirectory();
      const cacheFile = path.join(this.CACHE_DIR, `${key}.json`);
      
      if (!fs.existsSync(cacheFile)) {
        return null;
      }

      const cacheContent = fs.readFileSync(cacheFile, 'utf-8');
      const cache: CacheData<T> = JSON.parse(cacheContent);
      
      const now = Date.now();
      if (now - cache.timestamp > SEVEN_DAYS_MS) {
        fs.unlinkSync(cacheFile);
        return null;
      }
      
      return cache.data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  set<T>(key: string, data: T): void {
    try {
      this.ensureCacheDirectory();
      const cacheFile = path.join(this.CACHE_DIR, `${key}.json`);
      const cacheData: CacheData<T> = {
        timestamp: Date.now(),
        data
      };
      
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  }
}

// Create cache instance based on environment variable
const cacheStrategy: CacheStrategy = process.env.CACHING === 'FILE' 
  ? new FileCache() 
  : new InMemoryCache();

export function getCachedData<T>(key: string): T | null {
  return cacheStrategy.get<T>(key);
}

export function setCachedData<T>(key: string, data: T): void {
  cacheStrategy.set<T>(key, data);
}