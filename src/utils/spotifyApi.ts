import { SPOTIFY_CONFIG } from '../config/spotify';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CONFIG.CLIENT_ID,
  clientSecret: SPOTIFY_CONFIG.CLIENT_SECRET,
  redirectUri: SPOTIFY_CONFIG.REDIRECT_URI,
});

export async function refreshAccessToken(refreshToken: string) {
  spotifyApi.setRefreshToken(refreshToken);
  const data = await spotifyApi.refreshAccessToken();
  return data.body.access_token;
}

export async function fetchWithTokenRefresh(
  url: string,
  options: RequestInit,
  refreshToken?: string
): Promise<Response> {
  let response = await fetch(url, options);

  if (response.status === 401 && refreshToken) {
    // Token expired, refresh it
    const newAccessToken = await refreshAccessToken(refreshToken);
    
    // Update Authorization header with new token
    const newOptions = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newAccessToken}`,
      },
    };

    // Retry the request with new token
    response = await fetch(url, newOptions);
  }

  return response;
}