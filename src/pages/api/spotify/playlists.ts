import { NextApiRequest, NextApiResponse } from 'next';
import SpotifyWebApi from 'spotify-web-api-node';
import { SPOTIFY_CONFIG } from '../../../config/spotify';

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CONFIG.CLIENT_ID,
  clientSecret: SPOTIFY_CONFIG.CLIENT_SECRET,
});

async function searchTrack(spotifyApi: SpotifyWebApi, artist: string, album: string) {
  const query = `artist:${artist} album:${album}`;
  const result = await spotifyApi.searchTracks(query);
  return result.body.tracks?.items[0]?.uri;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { access_token } = req.query;

  if (!access_token) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  spotifyApi.setAccessToken(access_token as string);

  try {
    if (req.method === 'GET') {
      const { playlist_id } = req.query;

      if (playlist_id) {
        // Fetch tracks for a specific playlist
        console.log('Fetching tracks for playlist:', playlist_id);
        const data = await spotifyApi.getPlaylistTracks(playlist_id as string);
        
        const formattedTracks = data.body.items.map(item => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists.map(artist => artist.name).join(', '),
          album: item.track.album.name,
          duration: item.track.duration_ms
        }));

        return res.status(200).json({ items: formattedTracks });
      }

      // Fetch all playlists
      console.log('Fetching user playlists...');
      const data = await spotifyApi.getUserPlaylists();
      console.log('Playlists fetched:', data.body);
      
      // Ensure we're returning the expected format
      const formattedData = {
        items: data.body.items.map(playlist => ({
          id: playlist.id,
          name: playlist.name,
          images: playlist.images || []
        }))
      };
      
      return res.status(200).json(formattedData);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error in playlist handler:', error);
    // Check for specific Spotify API errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.message || 'Spotify API error',
        code: error.statusCode
      });
    }
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message
    });
  }
}