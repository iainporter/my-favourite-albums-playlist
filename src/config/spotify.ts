export const SPOTIFY_CONFIG = {
  CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || '',
  CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || '',
  REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
  SCOPES: [
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-private',
  ],
};

export const searchSpotify = async (query: string) => {
  try {
    const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search Spotify');
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching Spotify:', error);
    throw error;
  }
};