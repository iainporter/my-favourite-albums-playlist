import { NextApiRequest, NextApiResponse } from 'next';
import { SPOTIFY_CONFIG } from '../../../config/spotify';
import { generateCodeVerifier, generateCodeChallenge } from '../../../utils/pkce';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Generate PKCE verifier and challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // Store code verifier in session/cookie (you should implement this securely)
  res.setHeader('Set-Cookie', [
    `code_verifier=${codeVerifier}; HttpOnly; Path=/; SameSite=Lax`,
    `auth_state=${state}; HttpOnly; Path=/; SameSite=Lax`
  ]);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state: state,
    scope: SPOTIFY_CONFIG.SCOPES.join(' ')
  });

  const authorizeURL = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.redirect(authorizeURL);
}