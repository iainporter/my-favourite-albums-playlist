import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { fetchWithTokenRefresh } from '../../../utils/spotifyApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session || !session.accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const response = await fetchWithTokenRefresh(
      'https://api.spotify.com/v1/me/albums',
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
      session.refreshToken
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Spotify API');
    }

    const data = await response.json();
    
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