import React, { useState } from 'react';

interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  images: { url: string; height: number; width: number; }[];
  uri: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  track_number: number;
  artists: { name: string }[];
}

interface SearchFormProps {
  accessToken: string;
  albumSearchResults: SpotifyAlbum[];
  setAlbumSearchResults: (albums: SpotifyAlbum[]) => void;
}

export default function SearchForm({ accessToken, albumSearchResults, setAlbumSearchResults }: SearchFormProps) {
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [trackSearchResults, setTrackSearchResults] = useState<SpotifyTrack[]>([]);
  const [expandedTracks, setExpandedTracks] = useState<string | null>(null);
  const [albumTracks, setAlbumTracks] = useState<{ [key: string]: SpotifyTrack[] }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [previousUrl, setPreviousUrl] = useState<string | null>(null);
  const itemsPerPage = 20;

  const handleSearch = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string' && e.preventDefault) {
      e.preventDefault();
    }
    if (typeof e !== 'string' && e.type === 'submit') {
      setCurrentPage(1); // Reset to first page on new search
    }
    try {
      let searchUrl;
      if (typeof e === 'string') {
        // If a URL is provided, use it directly
        searchUrl = e;
      } else {
        // Otherwise, construct the search URL
        const fullQuery = `${artist ? `artist:${artist}` : ''} ${album ? `album:${album}` : ''}`.trim();
        const offset = (currentPage - 1) * itemsPerPage;
        searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(fullQuery)}&type=album&limit=${itemsPerPage}&offset=${offset}`;
      }

      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to search Spotify');
      }
      
      const data = await response.json();
      setTotalResults(data.albums.total);
      setNextUrl(data.albums.next);
      setPreviousUrl(data.albums.previous);

      // If no results found and we have an artist, try searching with just the artist
      if (data.albums.items.length === 0 && artist) {
        console.log('No results found with album name, trying artist-only search');
        const artistQuery = `artist:${artist}`;
        const fallbackResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistQuery)}&type=album&limit=10`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
        
        if (!fallbackResponse.ok) {
          throw new Error('Failed to perform fallback search');
        }
        
        const fallbackData = await fallbackResponse.json();
        setAlbumSearchResults(fallbackData.albums.items);
      } else {
        setAlbumSearchResults(data.albums.items);
      }
    } catch (error) {
      console.error('Error searching Spotify:', error);
      setAlbumSearchResults([]);
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

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="artist" className="block text-sm font-medium text-gray-300">
              Artist
            </label>
            <input
              type="text"
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-spotify-green focus:ring-spotify-green"
              placeholder="Enter artist name"
            />
          </div>
          <div>
            <label htmlFor="album" className="block text-sm font-medium text-gray-300">
              Album
            </label>
            <input
              type="text"
              id="album"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-spotify-green focus:ring-spotify-green"
              placeholder="Enter album name"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-spotify-green text-white rounded-full hover:bg-green-600 transition-colors duration-200"
        >
          Search Spotify
        </button>
      </form>

      <div className="space-y-4">
        {totalResults > 0 && (
          <div className="text-gray-300 text-sm">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} results
          </div>
        )}
        {albumSearchResults.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No Results Found</div>
        ) : (
          albumSearchResults.map((spotifyAlbum) => (
          <div key={spotifyAlbum.id} className="bg-gray-800 rounded-lg overflow-hidden">
            <div 
              className="flex items-center space-x-4 p-4 hover:bg-gray-700 cursor-pointer"
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
              draggable="true"
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  id: spotifyAlbum.id,
                  name: spotifyAlbum.name,
                  artist: artist,
                  releaseDate: spotifyAlbum.release_date,
                  image: spotifyAlbum.images[0]?.url,
                  uri: spotifyAlbum.uri
                }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <img
                src={spotifyAlbum.images[0]?.url}
                alt={spotifyAlbum.name}
                className="w-16 h-16 rounded-md object-cover"
              />
              <div className="flex-1">
                <h3 className="text-white">{spotifyAlbum.name}</h3>
                <p className="text-gray-400">{spotifyAlbum.release_date}</p>
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
              <div className="border-t border-gray-700">
                {albumTracks[spotifyAlbum.id] ? (
                  albumTracks[spotifyAlbum.id].map((track: SpotifyTrack) => (
                    <div 
                      key={track.id}
                      className="flex items-center text-sm text-gray-300 p-3 hover:bg-gray-700/50 cursor-move"
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          id: track.id,
                          name: track.name,
                          artist: track.artists[0]?.name,
                          album: spotifyAlbum.name,
                          duration: track.duration_ms,
                          uri: `spotify:track:${track.id}`
                        }));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
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
                  <div className="text-gray-400 text-sm p-4">Loading tracks...</div>
                )}
              </div>
            )}
          </div>
          ))
        )}
        {(nextUrl || previousUrl) && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => {
                if (previousUrl) {
                  setCurrentPage(prev => prev - 1);
                  handleSearch(previousUrl);
                }
              }}
              disabled={!previousUrl}
              className={`px-4 py-2 rounded-full ${
                !previousUrl
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-spotify-green text-white hover:bg-green-600'
              } transition-colors duration-200`}
            >
              Previous
            </button>
            <span className="text-gray-300">Page {currentPage}</span>
            <button
              onClick={() => {
                if (nextUrl) {
                  setCurrentPage(prev => prev + 1);
                  handleSearch(nextUrl);
                }
              }}
              disabled={!nextUrl}
              className={`px-4 py-2 rounded-full ${
                !nextUrl
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-spotify-green text-white hover:bg-green-600'
              } transition-colors duration-200`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}