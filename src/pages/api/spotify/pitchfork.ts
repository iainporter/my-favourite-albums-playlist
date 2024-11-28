import { NextApiRequest, NextApiResponse } from 'next';
import { parsePitchforkHtml, convertToAlbum } from '../../../utils/pitchforkParser';
import { logger } from '../../../utils/logger';


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
    logger.debug(`getting list of ${type} albums from Pitchfork`);
    
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
      logger.error(`Pitchfork API responded with status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    if (!html) {
      logger.error('Received empty HTML from Pitchfork');
      return res.status(500).json({ message: 'Received empty response from Pitchfork' });
    }

    const pitchforkAlbums = await parsePitchforkHtml(html);
    
    if (!pitchforkAlbums || pitchforkAlbums.length === 0) {
      logger.warn('No albums found in Pitchfork response');
      return res.status(404).json({ message: 'No albums found' });
    }

    const albums = pitchforkAlbums.map(convertToAlbum);
    res.status(200).json(albums);
  } catch (error) {
    clearTimeout(timeout);
    
    if (error.name === 'AbortError') {
      logger.error('Request to Pitchfork timed out');
      return res.status(504).json({ message: 'Request timed out' });
    }

    logger.error('Error fetching Pitchfork data:', error);
    res.status(500).json({ 
      message: 'Error fetching Pitchfork data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}