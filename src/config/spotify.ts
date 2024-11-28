// Validate environment variables
const validateSpotifyConfig = () => {
  const missingVars = [];
  
  if (!process.env.SPOTIFY_CLIENT_ID) missingVars.push('SPOTIFY_CLIENT_ID');
  if (!process.env.SPOTIFY_CLIENT_SECRET) missingVars.push('SPOTIFY_CLIENT_SECRET');
  
  console.log('Spotify Environment Variables Status:', {
    CLIENT_ID: process.env.SPOTIFY_CLIENT_ID ? 'Present' : 'Missing',
    CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET ? 'Present' : 'Missing',
    REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI || 'Using default'
  });

  if (missingVars.length > 0) {
    const errorMessage = `Missing required Spotify environment variables: ${missingVars.join(', ')}. Please check your .env file.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

// Run validation immediately
validateSpotifyConfig();

export const SPOTIFY_CONFIG = {
  CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || '',
  CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || '',
  REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/',
  SCOPES: [
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-private',
  ],
};