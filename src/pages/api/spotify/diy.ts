import type { NextApiRequest, NextApiResponse } from 'next';
import { DIYParser } from '../../../utils/diyParser';
import { getCachedData, setCachedData } from '../../../utils/cache';
import { Album } from '../../../types/album';

const CACHE_KEY = 'diy_magazine_reviews';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check cache first
    const cachedAlbums = getCachedData<Album[]>(CACHE_KEY);
    if (cachedAlbums) {
      return res.status(200).json(cachedAlbums);
    }

    // If no cache, fetch new data
    const response = await fetch('https://diymag.com/reviews/album-reviews');
    if (!response.ok) {
      throw new Error('Failed to fetch DIY Magazine reviews');
    }
    
    const html = await response.text();
    const parser = new DIYParser();
    const albums = parser.parseHtml(html);
    
    // Cache the results
    setCachedData(CACHE_KEY, albums);
    
    res.status(200).json(albums);
  } catch (error) {
    console.error('Error fetching DIY Magazine reviews:', error);
    res.status(500).json({ message: 'Failed to fetch DIY Magazine reviews' });
  }
}