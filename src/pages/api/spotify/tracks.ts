import { NextApiRequest, NextApiResponse } from 'next';
import { spotifyApi } from '../../../utils/spotifyApi';
import { SpotifyApi } from '../../../types/spotify';

const typedSpotifyApi = spotifyApi as SpotifyApi;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { albumId } = req.query;

  if (!albumId) {
    return res.status(400).json({ error: 'Album ID is required' });
  }

  try {
    const data = await typedSpotifyApi.getAlbumTracks(albumId as string);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
}