import fs from 'fs';
import path from 'path';
import { Album } from '../types/album';

interface CacheData<T> {
  timestamp: number;
  data: T;
}

const CACHE_DIR = path.join(process.cwd(), '.cache');
export function ensureCacheDirectory() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function getCachedData<T>(key: string): T | null {
  try {
    ensureCacheDirectory();
    const cacheFile = path.join(CACHE_DIR, `${key}.json`);
    
    if (!fs.existsSync(cacheFile)) {
      return null;
    }

    const cacheContent = fs.readFileSync(cacheFile, 'utf-8');
    const cache: CacheData<T> = JSON.parse(cacheContent);
    
    return cache.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    ensureCacheDirectory();
    const cacheFile = path.join(CACHE_DIR, `${key}.json`);
    const cacheData: CacheData<T> = {
      timestamp: Date.now(),
      data
    };
    
    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}