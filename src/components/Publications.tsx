import React, { useState } from 'react';
import { searchSpotify, SpotifyAlbum as SpotifyApiAlbum } from '../utils/spotifyApi';

interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  track_number: number;
  artists: { name: string }[];
}

interface PitchforkAlbum {
  artist: string;
  album: string;
  publishDate: string;
}

type SpotifyAlbum = SpotifyApiAlbum;

interface PublicationsProps {
  accessToken: string;
  refreshToken: string;
}

export default function Publications({ accessToken, refreshToken }: PublicationsProps) {
  const [albums, setAlbums] = useState<PitchforkAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{ [key: string]: SpotifyAlbum[] }>({});
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null);
  const [albumTracks, setAlbumTracks] = useState<{ [key: string]: SpotifyTrack[] }>({});
  const [expandedTracks, setExpandedTracks] = useState<string | null>(null);

  const fetchPitchforkAlbums = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/spotify/pitchfork');
      if (!response.ok) {
        throw new Error('Failed to fetch albums');
      }
      const data = await response.json();
      setAlbums(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumTracks = async (albumId: string) => {
    try {
      const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tracks');
      }
      const data = await response.json();
      setAlbumTracks(prev => ({ ...prev, [albumId]: data.items }));
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  const handleAlbumClick = async (artist: string, album: string) => {
    const searchKey = `${artist}-${album}`;
    if (expandedAlbum === searchKey) {
      setExpandedAlbum(null);
      return;
    }

    setExpandedAlbum(searchKey);
    if (!searchResults[searchKey]) {
      try {
        if (!accessToken) {
          throw new Error('No access token available');
        }
        const data = await searchSpotify(artist, album, accessToken, refreshToken);
        setSearchResults(prev => ({
          ...prev,
          [searchKey]: data.albums.items
        }));
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Failed to search Spotify');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4">
        <button
          onClick={fetchPitchforkAlbums}
          className="w-40 h-16 bg-black text-white rounded-lg shadow-lg flex items-center justify-center p-4 hover:bg-gray-900 transition-colors duration-200"
          disabled={loading}
        >
          <span className="text-sm font-bold">
            {loading ? 'Loading...' : 'Pitchfork 8.0+ new Albums'}
          </span>
        </button>
      </div>

      {error && (
        <div className="text-red-500 p-4">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {albums.length > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-white text-xl font-bold mb-4">Pitchfork Albums</h2>
            <div className="max-h-96 overflow-y-auto">
              {albums.map((album, index) => (
                <div key={index}>
                  <div
                    onClick={() => handleAlbumClick(album.artist, album.album)}
                    className="text-white py-2 px-4 hover:bg-gray-700 rounded transition-colors duration-200 mb-2 cursor-pointer"
                  >
                    <div className="font-bold">{album.artist}</div>
                    <div className="text-gray-300">{album.album}</div>
                    <div className="text-sm text-gray-400">{album.publishDate}</div>
                  </div>
                  {expandedAlbum === `${album.artist}-${album.album}` && (
                    <div className="ml-4 mb-4 p-4 bg-gray-700 rounded">
                      {searchResults[`${album.artist}-${album.album}`]?.map((spotifyAlbum) => (
                        <div key={spotifyAlbum.id}>
                          <div 
                            className="flex items-center space-x-2 p-2 hover:bg-gray-600 rounded cursor-pointer"
                            onClick={() => {
                              if (expandedTracks === spotifyAlbum.id) {
                                setExpandedTracks(null);
                              } else {
                                setExpandedTracks(spotifyAlbum.id);
                                if (!albumTracks[spotifyAlbum.id]) {
                                  fetchAlbumTracks(spotifyAlbum.id);
                                }
                              }
                            }}
                          >
                            {spotifyAlbum.images[2] && (
                              <img
                                src={spotifyAlbum.images[2].url}
                                alt={spotifyAlbum.name}
                                className="w-12 h-12"
                              />
                            )}
                            <div className="flex-1">
                              <div className="text-white font-semibold">{spotifyAlbum.name}</div>
                              <div className="text-gray-300 text-sm">
                                {spotifyAlbum.artists.map(a => a.name).join(', ')}
                              </div>
                            </div>
                            <svg 
                              className={`w-6 h-6 text-gray-400 transform transition-transform ${expandedTracks === spotifyAlbum.id ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {expandedTracks === spotifyAlbum.id && (
                            <div className="mt-2 ml-14 space-y-1">
                              {albumTracks[spotifyAlbum.id] ? (
                                albumTracks[spotifyAlbum.id].map((track: SpotifyTrack) => (
                                  <div 
                                    key={track.id}
                                    className="flex items-center text-sm text-gray-300 p-2 hover:bg-gray-600 rounded"
                                  >
                                    <span className="w-8 text-right text-gray-500">{track.track_number}.</span>
                                    <span className="ml-4">{track.name}</span>
                                    <span className="ml-auto text-gray-500">
                                      {Math.floor(track.duration_ms / 60000)}:
                                      {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-400 text-sm p-2">Loading tracks...</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}