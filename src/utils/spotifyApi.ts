import { SPOTIFY_CONFIG } from '../config/spotify';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CONFIG.CLIENT_ID,
  clientSecret: SPOTIFY_CONFIG.CLIENT_SECRET,
  redirectUri: SPOTIFY_CONFIG.REDIRECT_URI,
});

interface SpotifyTokenResponse {
  body: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
  };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    spotifyApi.setRefreshToken(refreshToken);
    const data = await spotifyApi.refreshAccessToken() as SpotifyTokenResponse;
    
    if (!data?.body?.access_token) {
      throw new Error('Invalid response from Spotify refresh token request');
    }

    return {
      accessToken: data.body.access_token,
      refreshToken: refreshToken, // Use the original refresh token as the new one is optional
      expiresIn: data.body.expires_in
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

export async function fetchWithTokenRefresh(
  url: string,
  options: RequestInit,
  refreshToken?: string
): Promise<Response> {
  try {
    let response = await fetch(url, options);

    if (response.status === 401 && refreshToken) {
      // Token expired, refresh it
      const tokens = await refreshAccessToken(refreshToken);
      
      // Update Authorization header with new token
      const newOptions = {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      };

      // Retry the request with new token
      response = await fetch(url, newOptions);
      
      // If the second request also fails, throw an error
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    return response;
  } catch (error) {
    console.error('Error in fetchWithTokenRefresh:', error);
    throw error;
  }
}