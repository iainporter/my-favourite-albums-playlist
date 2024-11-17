import React, { useState, useEffect } from 'react';
import { spotifyApi } from '../utils/spotifyApi';

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
  refreshToken: string;
  albumSearchResults: SpotifyAlbum[];
  setAlbumSearchResults: (albums: SpotifyAlbum[]) => void;
  initialPage?: number;
  initialArtist?: string;
  initialAlbum?: string;
  initialTotalResults?: number;
  initialNextUrl?: string | null;
  initialPrevUrl?: string | null;
  onSearchStateChange?: (state: { 
    currentPage: number; 
    artist: string; 
    album: string; 
    totalResults: number;
    nextUrl: string | null;
    previousUrl: string | null;
  }) => void;
}

export default function SearchForm({ 
  accessToken,
  refreshToken,
  albumSearchResults, 
  setAlbumSearchResults,
  initialPage = 1,
  initialArtist = '',
  initialAlbum = '',
  initialTotalResults = 0,
  initialNextUrl = null,
  initialPrevUrl = null,
  onSearchStateChange
}: SearchFormProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [artist, setArtist] = useState(initialArtist);
  const [album, setAlbum] = useState(initialAlbum);
  const [trackSearchResults, setTrackSearchResults] = useState<SpotifyTrack[]>([]);
  const [expandedTracks, setExpandedTracks] = useState<string | null>(null);
  const [albumTracks, setAlbumTracks] = useState<{ [key: string]: SpotifyTrack[] }>({});
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalResults, setTotalResults] = useState(initialTotalResults);
  const [nextUrl, setNextUrl] = useState<string | null>(initialNextUrl);
  const [previousUrl, setPreviousUrl] = useState<string | null>(initialPrevUrl);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Update state when initial values change
  useEffect(() => {
    setArtist(initialArtist);
  }, [initialArtist]);

  useEffect(() => {
    setAlbum(initialAlbum);
  }, [initialAlbum]);

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  // Add effect to validate tokens
  useEffect(() => {
    if (accessToken && accessToken.length > 0) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [accessToken]);

  // Save search state whenever relevant values change
  useEffect(() => {
    if (onSearchStateChange) {
      const debounceTimer = setTimeout(() => {
        onSearchStateChange({
          currentPage,
          artist,
          album,
          totalResults,
          nextUrl,
          previousUrl
        });
      }, 300);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [currentPage, artist, album]);
  const itemsPerPage = 20;



  const handleSearch = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string' && e.preventDefault) {
      e.preventDefault();
    }
    if (typeof e !== 'string' && e.type === 'submit') {
      const newPage = 1;
      setCurrentPage(newPage); // Reset to first page on new search
      if (onSearchStateChange) {
        onSearchStateChange({
          currentPage: newPage,
          artist,
          album,
          totalResults,
          nextUrl,
          previousUrl
        });
      }
    }
    
    if (!isAuthenticated) {
      console.error('Not authenticated');
      alert('Authentication error. Please try logging in again.');
      return;
    }

    setSearchError(null);
    setIsSearching(true);
    try {
      let data;
      if (typeof e === 'string') {
        // If a URL is provided, use it directly
        data = await spotifyApi.searchByUrl(accessToken, refreshToken, e);
      } else {
        // Otherwise, use the search function
        const offset = (currentPage - 1) * itemsPerPage;
        data = await spotifyApi.searchSpotify(artist, album, accessToken, refreshToken, offset, itemsPerPage);
      }

      if (!data || !data.albums) {
        throw new Error('Invalid response from Spotify API');
      }

      setTotalResults(data.albums.total);
      setNextUrl(data.albums.next);
      setPreviousUrl(data.albums.previous);

      // If no results found and we have an artist, try searching with just the artist
      if (data.albums.items.length === 0 && artist) {
        console.log('No results found with album name, trying artist-only search');
        const fallbackData = await spotifyApi.searchByArtist(accessToken, refreshToken, artist, 10);
        if (fallbackData && fallbackData.albums) {
          setAlbumSearchResults(fallbackData.albums.items);
        }
      } else {
        setAlbumSearchResults(data.albums.items);
      }
    } catch (error) {
      console.error('Error searching Spotify:', error);
      setAlbumSearchResults([]);
      setSearchError('Error searching Spotify. Please try logging in again if the problem persists.');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchAlbumTracks = async (albumId: string) => {
    try {
      const data = await spotifyApi.getAlbumTracks(accessToken, refreshToken, albumId);
      setAlbumTracks(prev => ({ ...prev, [albumId]: data.items }));
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-gray-800/95 backdrop-blur-sm z-10 space-y-4 pb-4">
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
            disabled={isSearching || !isAuthenticated}
            className={`w-1/2 mx-auto px-4 py-2 rounded-full transition-colors duration-200 flex items-center justify-center ${
              isSearching || !isAuthenticated
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-spotify-green hover:bg-green-600'
            } text-white`}
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Searching...
              </>
            ) : (
              'Search Spotify'
            )}
          </button>
        </form>
        
        {searchError && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-lg">
            {searchError}
          </div>
        )}

        {totalResults > 0 && (
          <div className="text-gray-300 text-sm">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} results
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
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
      </div>

      {(nextUrl || previousUrl) && albumSearchResults.length > 0 && (
        <div className="sticky bottom-0 mt-4 flex justify-between items-center py-3 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700">
          <button
            onClick={() => {
              if (previousUrl) {
                const newPage = currentPage - 1;
                setCurrentPage(newPage);
                handleSearch(previousUrl);
                if (onSearchStateChange) {
                  onSearchStateChange({
                    currentPage: newPage,
                    artist,
                    album,
                    totalResults,
                    nextUrl,
                    previousUrl
                  });
                }
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
                const newPage = currentPage + 1;
                setCurrentPage(newPage);
                handleSearch(nextUrl);
                if (onSearchStateChange) {
                  onSearchStateChange({
                    currentPage: newPage,
                    artist,
                    album,
                    totalResults,
                    nextUrl,
                    previousUrl
                  });
                }
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
  );
}