import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { spotifyApi } from '../../../utils/spotifyApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artist = '', album = '', offset = 0, limit = 20 } = req.body;

  if (!artist && !album) {
    return res.status(400).json({ error: 'Either artist or album parameter is required' });
  }

  try {
    const data = await spotifyApi.searchSpotify(
      artist,
      album,
      Number(offset),
      Number(limit)
    );

    res.status(200).json(data);
  } catch (error) {
    console.error('Spotify search error:', error);
    res.status(500).json({ error: 'Failed to search Spotify' });
  }
}