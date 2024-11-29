import { NextApiRequest, NextApiResponse } from 'next';
import { PitchforkParser } from '../../../utils/pitchforkParser';
import { getCachedData, setCachedData } from '../../../utils/cache';


export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Set response headers to prevent timeouts
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=60');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const type = req.query.type as string;
    
    // Check cache first
    const cacheKey = `pitchfork-${type}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    let url;
    switch (type) {
      case 'best-new':
        url = 'https://pitchfork.com/reviews/best/albums/';
        break;
      case 'latest':
        url = 'https://pitchfork.com/reviews/albums/';
        break;
      default:
        url = 'https://pitchfork.com/reviews/best/high-scoring-albums/';
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    if (!html) {
      return res.status(500).json({ message: 'Received empty response from Pitchfork' });
    }

    const parser = new PitchforkParser();
    const albums = await parser.parseHtml(html);
    
    if (!albums || albums.length === 0) {
      return res.status(404).json({ message: 'No albums found' });
    }
    
    // Cache the results
    setCachedData(cacheKey, albums);
    res.status(200).json(albums);
  } catch (error) {
    clearTimeout(timeout);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ message: 'Request timed out' });
    }

    res.status(500).json({
      message: 'Error fetching Pitchfork data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}