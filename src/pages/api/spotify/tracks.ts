import { NextApiRequest, NextApiResponse } from 'next';
import { spotifyApi } from '../../../utils/spotifyApi';

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
    const data = await spotifyApi.getAlbumTracks(accessToken, refreshToken, albumId as string);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
}