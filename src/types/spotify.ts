export interface SpotifyAlbum {
  id: string;
  name: string;
  release_date?: string;
  images: { url: string; height: number; width: number; }[];
  uri: string;
  artists?: Array<{ name: string }>;
  external_urls?: { spotify: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  track_number: number;
  artists: { name: string }[];
}

export interface SpotifyApi {
  createPlaylist(name: string, isPrivate?: boolean): Promise<any>;
  getUserPlaylists(offset?: number, limit?: number): Promise<any>;
  getAlbumTracks(albumId: string): Promise<any>;
  getPlaylist(playlistId: string): Promise<any>;
  addToPlaylist(playlistId: string, uriString: string): Promise<any>;
  getPlaylistItems(playlistId: string): Promise<any>;
  removeItemFromPlaylist(playlistId: string, uriString: string): Promise<any>;
  searchSpotify(artist: string, album: string, offset?: number, limit?: number): Promise<any>;
  searchByArtistAndAlbum(artist: string, album: string, limit?: number): Promise<any>;
  searchByArtist(artist: string, limit?: number): Promise<any>;
  getAlbumTracks(albumId: string): Promise<any>;
  getUserSavedAlbums(): Promise<any>;
  getCurrentUser(): Promise<any>;
  getTrack(trackId: string): Promise<any>;
  searchByUrl(searchUrl: string): Promise<any>;
}