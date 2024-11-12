import { NextApiRequest, NextApiResponse } from 'next';
import SpotifyWebApi from 'spotify-web-api-node';
import { SPOTIFY_CONFIG } from '../../../config/spotify';

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CONFIG.CLIENT_ID,
  clientSecret: SPOTIFY_CONFIG.CLIENT_SECRET,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { access_token } = req.query;

  if (!access_token) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  spotifyApi.setAccessToken(access_token as string);

  try {
    if (req.method === 'GET') {
      const data = await spotifyApi.getUserPlaylists();
      return res.status(200).json(data.body);
    } else if (req.method === 'DELETE') {
      const { playlist_id } = req.body;
      await spotifyApi.unfollowPlaylist(playlist_id);
      return res.status(200).json({ message: 'Playlist unfollowed successfully' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}