import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWithTokenRefresh } from '../../../utils/spotifyApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { albumId } = req.query;
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.split(' ')[1];
  const refreshToken = req.headers['x-refresh-token'] as string;

  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  if (!albumId) {
    return res.status(400).json({ error: 'Album ID is required' });
  }

  try {
    const response = await fetchWithTokenRefresh(
      `https://api.spotify.com/v1/albums/${albumId}/tracks`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      },
      refreshToken
    );

    if (!response.ok) {
      throw new Error('Failed to fetch tracks');
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
}