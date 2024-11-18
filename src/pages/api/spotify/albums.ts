import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { spotifyApi } from '../../../utils/spotifyApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await spotifyApi.getUserSavedAlbums();
    
    // Transform the Spotify response into our Album format
    const albums = data.items.map((item: any) => ({
      id: item.album.id,
      artist: item.album.artists[0].name,
      album: item.album.name,
      year: item.album.release_date.substring(0, 4),
      rating: '5' // Default rating for saved albums
    }));

    res.status(200).json(albums);
  } catch (error) {
    console.error('Spotify albums fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch albums from Spotify' });
  }
}