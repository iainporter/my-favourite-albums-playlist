import { NextApiRequest, NextApiResponse } from 'next';
import SpotifyWebApi from 'spotify-web-api-node';
import { SPOTIFY_CONFIG } from '../../../config/spotify';

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CONFIG.CLIENT_ID,
  clientSecret: SPOTIFY_CONFIG.CLIENT_SECRET,
});

async function searchAlbumTracks(spotifyApi: SpotifyWebApi, artist: string, album: string) {
  const query = `artist:${artist} album:${album}`;
  const result = await spotifyApi.searchTracks(query);
  return result.body.tracks?.items || [];
}

async function analyzeAlbumForPlaylist(tracks: any[], playlistName: string) {
  // Use OpenAI to analyze which tracks from the album would fit best in the playlist
  const prompt = `Given the playlist named "${playlistName}", which of these tracks would be the best fit? Consider the mood, genre, and style of the playlist name. Return only track URIs separated by commas.`;
  
  // For now, return all tracks as we haven't implemented the actual AI call
  return tracks.map(track => track.uri);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { access_token } = req.query;

  if (!access_token) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  spotifyApi.setAccessToken(access_token as string);

  try {
    if (req.method === 'POST' && req.query.action === 'add_album') {
      const { playlist_id } = req.query;
      const { artist, album } = req.body;

      if (!playlist_id || !artist || !album) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get playlist details for context
      const playlistDetails = await spotifyApi.getPlaylist(playlist_id as string);
      const playlistName = playlistDetails.body.name;

      // Search for all tracks from the album
      const tracks = await searchAlbumTracks(spotifyApi, artist, album);
      
      if (!tracks.length) {
        return res.status(404).json({ error: 'Album not found on Spotify' });
      }

      // Use AI to analyze which tracks would fit best in the playlist
      const selectedTrackUris = await analyzeAlbumForPlaylist(tracks, playlistName);
      
      if (!selectedTrackUris.length) {
        return res.status(404).json({ error: 'No suitable tracks found for this playlist' });
      }

      // Add the selected tracks to the playlist
      await spotifyApi.addTracksToPlaylist(playlist_id as string, selectedTrackUris);
      return res.status(200).json({ 
        success: true,
        tracksAdded: selectedTrackUris.length
      });
    }

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