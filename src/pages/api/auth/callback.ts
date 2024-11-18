import { NextApiRequest, NextApiResponse } from 'next';
import { SPOTIFY_CONFIG } from '../../../config/spotify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;
  const cookies = req.cookies;

  // Verify state and ensure code exists
  if (!code) {
    return res.redirect('/?error=no_code');
  }

  if (state !== cookies.auth_state) {
    return res.redirect('/?error=state_mismatch');
  }

  const codeVerifier = cookies.code_verifier;
  if (!codeVerifier) {
    return res.redirect('/?error=missing_verifier');
  }

  try {
    // Exchange code for tokens using PKCE
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    
    // Clear the PKCE and state cookies
    res.setHeader('Set-Cookie', [
      'code_verifier=; HttpOnly; Path=/; Max-Age=0',
      'auth_state=; HttpOnly; Path=/; Max-Age=0'
    ]);

    // Encode the tokens to make them URL-safe
    const encodedParams = new URLSearchParams({
      access_token: encodeURIComponent(data.access_token),
      refresh_token: encodeURIComponent(data.refresh_token)
    });
    
    res.redirect(`/?${encodedParams.toString()}`);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.redirect('/?error=auth_failed');
  }
}