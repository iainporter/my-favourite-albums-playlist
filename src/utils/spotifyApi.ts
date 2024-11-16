import { SPOTIFY_CONFIG } from '../config/spotify';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyWebApi = new SpotifyWebApi({
  clientId: SPOTIFY_CONFIG.CLIENT_ID,
  clientSecret: SPOTIFY_CONFIG.CLIENT_SECRET,
  redirectUri: SPOTIFY_CONFIG.REDIRECT_URI,
});

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

class SpotifyApi {
  private async refreshAccessToken(refreshToken: string): Promise<string> {
    spotifyWebApi.setRefreshToken(refreshToken);
    const data = await spotifyWebApi.refreshAccessToken();
    return data.body.access_token;
  }

  private async fetchWithTokenRefresh(
    url: string,
    options: RequestInit,
    refreshToken: string
  ): Promise<Response> {
    try {
      let response = await fetch(url, options);

      if (response.status === 401) {
        // Token expired, refresh it
        const newAccessToken = await this.refreshAccessToken(refreshToken);
        
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
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('Error in fetchWithTokenRefresh:', error);
      throw error;
    }
  }

  async createPlaylist(accessToken: string, refreshToken: string, userId: string, name: string) {
    const url = `https://api.spotify.com/v1/users/${userId}/playlists`;
    const response = await this.fetchWithTokenRefresh(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      },
      refreshToken
    );
    return response.json();
  }

  async getUserPlaylists(accessToken: string, refreshToken: string, userId: string, offset: number = 0, limit: number = 20) {
    const url = `https://api.spotify.com/v1/users/${userId}/playlists?offset=${offset}&limit=${limit}`;
    const response = await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      },
      refreshToken
    );
    return response.json();
  }

  async getPlaylist(accessToken: string, refreshToken: string, playlistId: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
    const response = await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      },
      refreshToken
    );
    return response.json();
  }

  async addToPlaylist(accessToken: string, refreshToken: string, playlistId: string, uriString: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const response = await this.fetchWithTokenRefresh(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [uriString] }),
      },
      refreshToken
    );
    return response.json();
  }

  async getPlaylistItems(accessToken: string, refreshToken: string, playlistId: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const response = await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      },
      refreshToken
    );
    return response.json();
  }

  async removeItemFromPlaylist(accessToken: string, refreshToken: string, playlistId: string, uriString: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const response = await this.fetchWithTokenRefresh(
      url,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracks: [{ uri: uriString }],
        }),
      },
      refreshToken
    );
    return response.json();
  }

  async searchSpotify(
    artist: string,
    album: string,
    accessToken: string,
    refreshToken: string,
    offset: number = 0,
    limit: number = 20
  ): Promise<SpotifySearchResponse> {
    const fullQuery = `${artist ? `artist:${artist}` : ''} ${album ? `album:${album}` : ''}`.trim();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(fullQuery)}&type=album&limit=${limit}&offset=${offset}`;
    
    const response = await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      },
      refreshToken
    );

    return response.json();
  }
}

export const spotifyApi = new SpotifyApi();