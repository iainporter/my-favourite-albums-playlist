import React, { useState } from 'react';
import { searchSpotify, SpotifyAlbum as SpotifyApiAlbum } from '../utils/spotifyApi';

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

  const handleAlbumClick = async (artist: string, album: string) => {
    const searchKey = `${artist}-${album}`;
    if (expandedAlbum === searchKey) {
      setExpandedAlbum(null);
      return;
    }

    setExpandedAlbum(searchKey);
    if (!searchResults[searchKey]) {
      try {

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
                        <a
                          key={spotifyAlbum.id}
                          href={spotifyAlbum.external_urls.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-2 hover:bg-gray-600 rounded mb-2"
                        >
                          {spotifyAlbum.images[2] && (
                            <img
                              src={spotifyAlbum.images[2].url}
                              alt={spotifyAlbum.name}
                              className="w-12 h-12 mr-4"
                            />
                          )}
                          <div>
                            <div className="text-white font-semibold">{spotifyAlbum.name}</div>
                            <div className="text-gray-300 text-sm">
                              {spotifyAlbum.artists.map(a => a.name).join(', ')}
                            </div>
                          </div>
                        </a>
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