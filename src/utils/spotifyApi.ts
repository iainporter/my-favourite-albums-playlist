import { SPOTIFY_CONFIG } from '../config/spotify';

import { SpotifyAlbum } from '../types/spotify';

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

  private async refreshAccessToken(refreshToken: string): Promise<any> {
    if (!SPOTIFY_CONFIG.CLIENT_ID) {
      throw new Error('Missing Spotify client credentials');
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
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refreshToken', data.refresh_token);
    }
    return data;
  }

  private async fetchWithTokenRefresh(url: string, options: RequestInit): Promise<any> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const requestOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
    };

    let response = await fetch(url, requestOptions);

    if (response.status === 401) {
      // Token expired, refresh it
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const newTokens = await this.refreshAccessToken(refreshToken);
      
      // Retry the request with the new access token
      const retryOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newTokens.access_token}`,
        },
      };

      response = await fetch(url, retryOptions);
    }

    if (!response.ok) {
      throw new Error('Failed to fetch Spotify data');
    }

    return response.json();
  }

  async createPlaylist(name: string, isPrivate: boolean = false) {
    const url = `https://api.spotify.com/v1/me/playlists`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        method: 'POST',
        headers: {
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
    const url = `https://api.spotify.com/v1/me/playlists?offset=${offset}&limit=${limit}`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {},
      }
    );
  }

  async getPlaylist(playlistId: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {},
      }
    );
  }

  async addToPlaylist(playlistId: string, uriString: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const uris = uriString.includes(',') ? uriString.split(',') : [uriString];
    return await this.fetchWithTokenRefresh(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris }),
      }
    );
  }

  async getPlaylistItems(playlistId: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {},
      }
    );
  }

  async removeItemFromPlaylist(playlistId: string, uriString: string) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        method: 'DELETE',
        headers: {
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
    const fullQuery = `${artist ? `artist:${artist}` : ''} ${album ? `album:${album}` : ''}`.trim();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(fullQuery)}&type=album&limit=${limit}&offset=${offset}`;
    
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {}
      }
    );
  }

  async searchByArtistAndAlbum(
    artist: string,
    album: string,
    limit: number = 10
  ): Promise<SpotifySearchResponse> {
    const query = `artist:${artist} album:${album}`;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`;
    
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {}
      }
    );
  }

  async searchByArtist(
    artist: string,
    limit: number = 10
  ): Promise<SpotifySearchResponse> {
    const query = `artist:${artist}`;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`;
    
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {}
      }
    );
  }

  async getAlbumTracks(albumId: string) {
    const url = `https://api.spotify.com/v1/albums/${albumId}/tracks`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {},
      }
    );
  }

  async getUserSavedAlbums() {
    const url = 'https://api.spotify.com/v1/me/albums';
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {},
      }
    );
  }

  async getCurrentUser() {
    const url = 'https://api.spotify.com/v1/me';
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {},
      }
    );
  }

  async getTrack(trackId: string) {
    const url = `https://api.spotify.com/v1/tracks/${trackId}`;
    return await this.fetchWithTokenRefresh(
      url,
      {
        headers: {},
      }
    );
  }

  async searchByUrl(searchUrl: string): Promise<SpotifySearchResponse> {
    return await this.fetchWithTokenRefresh(
      searchUrl,
      {
        headers: {}
      }
    );
  }
}

export const spotifyApi = new SpotifyApi();