import { SPOTIFY_CONFIG } from '../config/spotify';
import { SpotifyAlbum, SpotifyApi as ISpotifyApi } from '../types/spotify';
import { AuthError } from './errorHandler';

export interface SpotifySearchResponse {
  albums: {
    items: SpotifyAlbum[];
    total: number;
    next: string | null;
    previous: string | null;
  };
}

class SpotifyApi implements ISpotifyApi {
  constructor() {
    // Debug logging for SPOTIFY_CONFIG when SpotifyApi is instantiated
    console.log('SpotifyApi initialized with config:', {
      clientIdPresent: !!SPOTIFY_CONFIG.CLIENT_ID,
      clientSecretPresent: !!SPOTIFY_CONFIG.CLIENT_SECRET,
      redirectUri: SPOTIFY_CONFIG.REDIRECT_URI
    });
  }

  private async refreshAccessToken(refreshToken: string) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SPOTIFY_CONFIG.CLIENT_ID
      }),
    });

    if (!response.ok) {
      this.rethrowAuthError()
    }

    return response.json();
  }


  private async fetchWithTokenRefresh(
    url: string,
    options: RequestInit
  ): Promise<any> {
    try {

      let response = await fetch(url, options);
      let responseData;

      if (response.status === 401) {
        console.log('Access token expired, attempting to refresh...');
        try {
          if (!SPOTIFY_CONFIG.CLIENT_ID) {
            throw new Error('Missing Spotify client credentials. Please check your .env file and ensure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set.');
          }

          // Token expired, refresh it
          const refreshToken = localStorage.getItem('refreshToken');
          const newTokens = await this.refreshAccessToken(refreshToken);
          const newAccessToken = newTokens.access_token;
          localStorage.setItem('accessToken', newAccessToken);
          // Check if a new refresh token is provided and update it if necessary
         if (newTokens.refresh_token) {
            localStorage.setItem('refreshToken', newTokens.refresh_token);
         }
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

  async createPlaylist(name: string, isPrivate: boolean = false) {
    const accessToken = localStorage.getItem('accessToken');
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
      }
    );
  }

  async getUserPlaylists(offset: number = 0, limit: number = 20) {
    const accessToken = localStorage.getItem('accessToken');
    const url = `https://api.spotify.com/v1/me/playlists?offset=${offset}&limit=${limit}`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
  }

  async getPlaylist(playlistId: string) {
    const accessToken = localStorage.getItem('accessToken');
    const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
  }

  async addToPlaylist(playlistId: string, uriString: string) {
    const accessToken = localStorage.getItem('accessToken');
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
      }
    );
  }

  async getPlaylistItems(playlistId: string) {
    const accessToken = localStorage.getItem('accessToken');
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
  }

  async removeItemFromPlaylist(playlistId: string, uriString: string) {
    const accessToken = localStorage.getItem('accessToken');
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
      }
    );
  }

  async searchSpotify(
    artist: string,
    album: string,
    offset: number = 0,
    limit: number = 20
  ): Promise<SpotifySearchResponse> {
    const accessToken = localStorage.getItem('accessToken');
    const fullQuery = `${artist ? `artist:${artist}` : ''} ${album ? `album:${album}` : ''}`.trim();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(fullQuery)}&type=album&limit=${limit}&offset=${offset}`;
    
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
  }

  async searchByArtistAndAlbum(
    artist: string,
    album: string,
    limit: number = 10
  ): Promise<SpotifySearchResponse> {
    const accessToken = localStorage.getItem('accessToken');
    const query = `artist:${artist} album:${album}`;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`;
    
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
  }

  async searchByArtist(
    artist: string,
    limit: number = 10
  ): Promise<SpotifySearchResponse> {
    const accessToken = localStorage.getItem('accessToken');
    const query = `artist:${artist}`;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`;
    
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
  }


  async getAlbumTracks(albumId: string) {
    const accessToken = localStorage.getItem('accessToken');
    const url = `https://api.spotify.com/v1/albums/${albumId}/tracks`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
  }

  async getUserSavedAlbums() {
    const accessToken = localStorage.getItem('accessToken');
    const url = 'https://api.spotify.com/v1/me/albums';
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
  }

  async getCurrentUser() {
    const accessToken = localStorage.getItem('accessToken');
    const url = 'https://api.spotify.com/v1/me';
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
  }

  async getTrack(trackId: string) {
    const accessToken = localStorage.getItem('accessToken');
    const url = `https://api.spotify.com/v1/tracks/${trackId}`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
  }

  async searchByUrl(
    searchUrl: string
  ): Promise<SpotifySearchResponse> {
    const accessToken = localStorage.getItem('accessToken');
    return await this.fetchWithTokenRefresh(
      searchUrl,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
  }

  //This will cause the user to be thrown out to a login page
  private rethrowAuthError() {
          // Clear tokens from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw new AuthError('Failed to refresh access token');
  }
}

export const spotifyApi = new SpotifyApi();