import { NextApiRequest, NextApiResponse } from 'next';
import SpotifyWebApi from 'spotify-web-api-node';
import { spotifyApi as spotifyApiClient } from '../../../utils/spotifyApi';

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

  try {
    if (req.method === 'POST' && !req.query.action) {
      // Create a new playlist
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Missing playlist name' });
      }

      // First get the current user's ID
      const userData = await spotifyApiClient.getCurrentUser();
      const userId = userData.id;

      // Create the playlist
      const response = await spotifyApiClient.createPlaylist(
        name,
        true // make it private
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create playlist');
      }

      const result = await response.json();
      return res.status(201).json(result);
    }

    if (req.method === 'POST' && req.query.action === 'add_track') {
      const { playlist_id } = req.query;
      const { uri } = req.body;

      if (!playlist_id || !uri) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Add single track to playlist
      const response = await spotifyApiClient.addToPlaylist(
        playlist_id as string,
        uri
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to add track to playlist');
      }

      const result = await response.json();
      return res.status(200).json({ 
        success: true,
        snapshot_id: result.snapshot_id
      });
    }

    if (req.method === 'POST' && req.query.action === 'add_album') {
      const { playlist_id } = req.query;
      const { uri } = req.body;

      if (!playlist_id || !uri) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Extract album ID from URI (format: spotify:album:id)
      const albumId = uri.split(':')[2];

      // First, fetch all tracks from the album
      const albumTracksResponse = await spotifyApiClient.getAlbumTracks(
        albumId
      );

      if (!albumTracksResponse.ok) {
        const error = await albumTracksResponse.json();
        throw new Error(error.error?.message || 'Failed to fetch album tracks');
      }

      const albumTracks = await albumTracksResponse.json();
      const trackUris = albumTracks.items.map((track: any) => track.uri);

      // Then add all tracks to the playlist
      const response = await spotifyApiClient.addToPlaylist(
        playlist_id as string,
        trackUris.join(',')
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to add tracks to playlist');
      }

      const result = await response.json();
      return res.status(200).json({ 
        success: true,
        snapshot_id: result.snapshot_id
      });
    }

    if (req.method === 'POST' && req.query.action === 'remove_track') {
      const { playlist_id } = req.query;
      const { trackId } = req.body;

      if (!playlist_id || !trackId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Get the track URI
      const trackResponse = await spotifyApiClient.getTrack(
        trackId
      );

      if (!trackResponse.ok) {
        const error = await trackResponse.json();
        throw new Error(error.error?.message || 'Failed to fetch track details');
      }

      const trackData = await trackResponse.json();
      const trackUri = trackData.uri;

      // Remove the track from the playlist
      const response = await spotifyApiClient.removeItemFromPlaylist(
        playlist_id as string,
        trackUri
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to remove track from playlist');
      }

      const result = await response.json();
      return res.status(200).json({ 
        success: true,
        snapshot_id: result.snapshot_id
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

      // Fetch all playlists with pagination
      console.log('Fetching user playlists...');
      const limit = 20; // Number of playlists per page
      const offset = parseInt(req.query.offset as string) || 0;
      
      const data = await spotifyApi.getUserPlaylists({ limit, offset });
      console.log('Playlists fetched:', data.body);
      
      // Ensure we're returning the expected format with pagination info
      const accessToken = localStorage.getItem('accessToken');
      const formattedData = {
        items: data.body.items.map(playlist => ({
          id: playlist.id,
          name: playlist.name,
          images: playlist.images || []
        })),
        next: data.body.next ? `/api/spotify/playlists?access_token=${access_token}&offset=${offset + limit}` : null,
        previous: offset > 0 ? `/api/spotify/playlists?access_token=${access_token}&offset=${Math.max(0, offset - limit)}` : null,
        total: data.body.total
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