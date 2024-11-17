import { SPOTIFY_CONFIG } from '../config/spotify';

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
  constructor() {
    // Debug logging for SPOTIFY_CONFIG when SpotifyApi is instantiated
    console.log('SpotifyApi initialized with config:', {
      clientIdPresent: !!SPOTIFY_CONFIG.CLIENT_ID,
      clientSecretPresent: !!SPOTIFY_CONFIG.CLIENT_SECRET,
      redirectUri: SPOTIFY_CONFIG.REDIRECT_URI
    });
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      // Debug logging during token refresh
      console.log('Attempting token refresh with config:', {
        clientIdPresent: !!SPOTIFY_CONFIG.CLIENT_ID,
        clientSecretPresent: !!SPOTIFY_CONFIG.CLIENT_SECRET
      });
      if (!SPOTIFY_CONFIG.CLIENT_ID || !SPOTIFY_CONFIG.CLIENT_SECRET) {
        throw new Error('Missing Spotify client credentials. Please check your .env file and ensure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set.');
      }

      if (!refreshToken) {
        throw new Error('No refresh token provided. Please ensure you are properly authenticated with Spotify.');
      }

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            SPOTIFY_CONFIG.CLIENT_ID + ':' + SPOTIFY_CONFIG.CLIENT_SECRET
          ).toString('base64'),
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Token refresh failed:', data);
        throw new Error(`Failed to refresh token: ${data.error_description || data.error || 'Unknown error'}`);
      }

      if (!data.access_token) {
        throw new Error('No access token returned from Spotify');
      }

      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  private async fetchWithTokenRefresh(
    url: string,
    options: RequestInit,
    refreshToken: string
  ): Promise<any> {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token provided');
      }

      let response = await fetch(url, options);
      let responseData;

      if (response.status === 401) {
        console.log('Access token expired, attempting to refresh...');
        try {
          if (!SPOTIFY_CONFIG.CLIENT_ID || !SPOTIFY_CONFIG.CLIENT_SECRET) {
            throw new Error('Missing Spotify client credentials. Please check your .env file and ensure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set.');
          }
          
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
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          if (refreshError.message.includes('Missing Spotify client credentials')) {
            throw refreshError;
          }
          throw new Error(`Token refresh failed: ${refreshError.message}`);
        }
      }

      try {
        responseData = await response.json();
      } catch (e) {
        // Response might not be JSON
        responseData = null;
      }

      if (!response.ok) {
        const errorMessage = responseData?.error?.message || responseData?.error || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      console.error('Error in fetchWithTokenRefresh:', error);
      throw error;
    }
  }

  async createPlaylist(accessToken: string, refreshToken: string, name: string, isPrivate: boolean = false) {
    const url = `https://api.spotify.com/v1/me/playlists`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name,
          public: !isPrivate 
        }),
      },
      refreshToken
    );
  }

  async getUserPlaylists(accessToken: string, refreshToken: string, offset: number = 0, limit: number = 20) {
    const url = `https://api.spotify.com/v1/me/playlists?offset=${offset}&limit=${limit}`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      },
      refreshToken
    );
  }

  async getPlaylist(accessToken: string, refreshToken: string, playlistId: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      },
      refreshToken
    );
  }

  async addToPlaylist(accessToken: string, refreshToken: string, playlistId: string, uriString: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const uris = uriString.includes(',') ? uriString.split(',') : [uriString];
    return await this.fetchWithTokenRefresh(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris }),
      },
      refreshToken
    );
  }

  async getPlaylistItems(accessToken: string, refreshToken: string, playlistId: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      },
      refreshToken
    );
  }

  async removeItemFromPlaylist(accessToken: string, refreshToken: string, playlistId: string, uriString: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    return await this.fetchWithTokenRefresh(
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
    
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      },
      refreshToken
    );
  }

  async searchByArtistAndAlbum(
    accessToken: string,
    refreshToken: string,
    artist: string,
    album: string,
    limit: number = 10
  ): Promise<SpotifySearchResponse> {
    const query = `artist:${artist} album:${album}`;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`;
    
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      },
      refreshToken
    );
  }

  async searchByArtist(
    accessToken: string,
    refreshToken: string,
    artist: string,
    limit: number = 10
  ): Promise<SpotifySearchResponse> {
    const query = `artist:${artist}`;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`;
    
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      },
      refreshToken
    );
  }
  async getAlbumTracks(accessToken: string, refreshToken: string, albumId: string) {
    const url = `https://api.spotify.com/v1/albums/${albumId}/tracks`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      },
      refreshToken
    );
  }

  async getUserSavedAlbums(accessToken: string, refreshToken: string) {
    const url = 'https://api.spotify.com/v1/me/albums';
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      },
      refreshToken
    );
  }

  async getCurrentUser(accessToken: string, refreshToken: string) {
    const url = 'https://api.spotify.com/v1/me';
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      },
      refreshToken
    );
  }

  async getTrack(accessToken: string, refreshToken: string, trackId: string) {
    const url = `https://api.spotify.com/v1/tracks/${trackId}`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      },
      refreshToken
    );
  }
}

  async searchByUrl(
    accessToken: string,
    refreshToken: string,
    searchUrl: string
  ): Promise<SpotifySearchResponse> {
    return await this.fetchWithTokenRefresh(
      searchUrl,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      },
      refreshToken
    );
  }
}

export const spotifyApi = new SpotifyApi();