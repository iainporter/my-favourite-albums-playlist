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

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  images: Array<{ url: string; height: number; width: number }>;
  external_urls: { spotify: string };
  uri: string;
  release_date?: string;
}

export interface SpotifySearchResponse {
  albums: {
    items: SpotifyAlbum[];
    total: number;
    next: string | null;
    previous: string | null;
  };
}

export async function searchSpotify(
  artist: string,
  album: string,
  accessToken: string,
  refreshToken?: string,
  offset: number = 0,
  limit: number = 20
): Promise<SpotifySearchResponse> {
  const fullQuery = `${artist ? `artist:${artist}` : ''} ${album ? `album:${album}` : ''}`.trim();
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(fullQuery)}&type=album&limit=${limit}&offset=${offset}`;
  
  const response = await fetchWithTokenRefresh(
    url,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    },
    refreshToken
  );

  if (!response.ok) {
    throw new Error('Failed to search Spotify');
  }

  return response.json();
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
      const newAccessToken = await refreshAccessToken(refreshToken);
      
      // Update Authorization header with new token
      const newOptions = {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${newAccessToken}`,
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