import { NextApiRequest, NextApiResponse } from 'next';
import SpotifyWebApi from 'spotify-web-api-node';
import { SPOTIFY_CONFIG } from '../../../config/spotify';

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CONFIG.CLIENT_ID,
  clientSecret: SPOTIFY_CONFIG.CLIENT_SECRET,
  redirectUri: SPOTIFY_CONFIG.REDIRECT_URI,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code as string);
    
    // Store tokens in cookies or handle them securely
    const params = new URLSearchParams({
      access_token: data.body.access_token,
      refresh_token: data.body.refresh_token,
      token_type: data.body.token_type,
      expires_in: data.body.expires_in.toString()
    });
    
    // Encode the tokens to make them URL-safe
    const encodedParams = new URLSearchParams({
      access_token: encodeURIComponent(data.body.access_token),
      refresh_token: encodeURIComponent(data.body.refresh_token)
    });
    
    res.redirect(`/?${encodedParams.toString()}`);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.redirect('/?error=auth_failed');
  }
}