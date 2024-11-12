import { NextApiRequest, NextApiResponse } from 'next';
import SpotifyWebApi from 'spotify-web-api-node';
import { SPOTIFY_CONFIG } from '../../../config/spotify';

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CONFIG.CLIENT_ID,
  clientSecret: SPOTIFY_CONFIG.CLIENT_SECRET,
  redirectUri: SPOTIFY_CONFIG.REDIRECT_URI,
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const authorizeURL = spotifyApi.createAuthorizeURL(SPOTIFY_CONFIG.SCOPES, '');
  res.redirect(authorizeURL);
}