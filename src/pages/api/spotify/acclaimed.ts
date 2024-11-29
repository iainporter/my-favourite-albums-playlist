import type { NextApiRequest, NextApiResponse } from 'next';
import { parseAcclaimedHtml } from '../../../utils/acclaimedParser';
import { handleApiError } from '../../../utils/errorHandler';
import { getCachedData, setCachedData } from '../../../utils/cache';
import { Album } from '../../../types/album';

const CACHE_KEY = 'acclaimed_albums';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Try to get data from cache first
    const cachedAlbums = getCachedData<Album[]>(CACHE_KEY);
    if (cachedAlbums) {
      return res.status(200).json(cachedAlbums);
    }

    // If no cache or expired, fetch fresh data
    const response = await fetch('https://www.acclaimedmusic.net/year/alltime_albums.htm');
    const html = await response.text();
    const albums = parseAcclaimedHtml(html);
    
    // Cache the results
    setCachedData(CACHE_KEY, albums);
    
    res.status(200).json(albums);
  } catch (error) {
    handleApiError(error);
  }
}