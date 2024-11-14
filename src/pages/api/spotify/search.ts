import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { fetchWithTokenRefresh } from '../../../utils/spotifyApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q, offset = '0', limit = '20' } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const session = await getSession({ req });
    if (!session || !session.accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const response = await fetchWithTokenRefresh(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(String(q))}&type=album&limit=${limit}&offset=${offset}`,
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
    res.status(200).json(data);
  } catch (error) {
    console.error('Spotify search error:', error);
    res.status(500).json({ error: 'Failed to search Spotify' });
  }
}