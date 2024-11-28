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
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
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

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Spotify token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      });
      return res.redirect(`/?error=token_exchange_failed&status=${tokenResponse.status}`);
    }

    const response = tokenResponse;

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    
    // Clear the PKCE and state cookies
    res.setHeader('Set-Cookie', [
      'code_verifier=; HttpOnly; Path=/; Max-Age=0',
      'auth_state=; HttpOnly; Path=/; Max-Age=0'
    ]);

    // Pass tokens to the client side where they will be stored in localStorage
    const encodedParams = new URLSearchParams({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in.toString()
    });
    
    res.redirect(`/?${encodedParams.toString()}`);
  } catch (error) {
    console.error('Error in Spotify authentication callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.redirect(`/?error=auth_failed&message=${encodeURIComponent(errorMessage)}`);
  }
}