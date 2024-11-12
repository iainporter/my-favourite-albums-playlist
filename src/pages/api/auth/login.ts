import { NextApiRequest, NextApiResponse } from 'next';
import SpotifyWebApi from 'spotify-web-api-node';
import { SPOTIFY_CONFIG } from '../../../config/spotify';

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CONFIG.CLIENT_ID,
  clientSecret: SPOTIFY_CONFIG.CLIENT_SECRET,
  redirectUri: SPOTIFY_CONFIG.REDIRECT_URI,
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Generate a random state string
  const state = Math.random().toString(36).substring(7);
  
  const authorizeURL = spotifyApi.createAuthorizeURL(
    SPOTIFY_CONFIG.SCOPES,
    state
  );
  res.redirect(authorizeURL);
}