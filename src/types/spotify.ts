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