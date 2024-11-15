import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { searchSpotify } from '../../../utils/spotifyApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artist = '', album = '', q, offset = '0', limit = '20' } = req.query;

  // Support both new artist/album params and legacy q param
  if (!artist && !album && !q) {
    return res.status(400).json({ error: 'Either artist/album or q parameter is required' });
  }

  try {
    const session = await getSession({ req });
    if (!session || !session.accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let searchArtist = artist as string;
    let searchAlbum = album as string;

    // Handle legacy q parameter
    if (q && !artist && !album) {
      const qStr = String(q);
      // Simple heuristic: if q contains "artist:" or "album:", parse it
      if (qStr.includes('artist:') || qStr.includes('album:')) {
        const artistMatch = qStr.match(/artist:([^ ]+)/);
        const albumMatch = qStr.match(/album:([^ ]+)/);
        searchArtist = artistMatch ? artistMatch[1] : '';
        searchAlbum = albumMatch ? albumMatch[1] : '';
      } else {
        // If no specific format, use the whole query as a general search
        searchArtist = qStr;
        searchAlbum = '';
      }
    }

    const data = await searchSpotify(
      searchArtist,
      searchAlbum,
      session.accessToken,
      session.refreshToken,
      Number(offset),
      Number(limit)
    );

    res.status(200).json(data);
  } catch (error) {
    console.error('Spotify search error:', error);
    res.status(500).json({ error: 'Failed to search Spotify' });
  }
}