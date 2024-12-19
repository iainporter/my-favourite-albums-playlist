import React, { useState, useEffect } from 'react';
import { spotifyApi } from '../utils/spotifyApi';
import { SpotifyApi } from '../types/spotify';
import { logger } from '../utils/logger';
const typedSpotifyApi = spotifyApi as SpotifyApi;

import { SpotifyAlbum, SpotifyTrack } from '../types/spotify';
import SpotifyAttribution from './SpotifyAttribution';
import SpotifyBadge from './SpotifyBadge';
import Image from 'next/image';
import SpotifyUsageGuidelines from './SpotifyUsageGuidelines';
import { useSpotifyGuidelines } from '../hooks/useSpotifyGuidelines';

interface SearchFormProps {
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
  // Add console log for props
  console.log('SearchForm props:', {
    initialPage,
    initialArtist,
    initialAlbum,
    initialTotalResults,
    hasSearchResults: albumSearchResults.length > 0
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [artist, setArtist] = useState(initialArtist);
  const [album, setAlbum] = useState(initialAlbum);
  const [trackSearchResults, setTrackSearchResults] = useState<SpotifyTrack[]>([]);
  const [expandedTracks, setExpandedTracks] = useState<string | null>(null);
  const [albumTracks, setAlbumTracks] = useState<{ [key: string]: SpotifyTrack[] }>({});
  const [tracksPagination, setTracksPagination] = useState<{
    [key: string]: {
      offset: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }>({});
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalResults, setTotalResults] = useState(initialTotalResults);
  const [nextUrl, setNextUrl] = useState<string | null>(initialNextUrl);
  const [previousUrl, setPreviousUrl] = useState<string | null>(initialPrevUrl);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  console.log('init SearchForm...');
  // Check authentication status on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem('accessToken');
      setIsAuthenticated(!!accessToken);
    };

    // Check initial auth state
    checkAuth();

    // Listen for storage changes (in case token is updated in another tab)
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Debug logging for component lifecycle
  useEffect(() => {
    console.log('SearchForm mounted');
    return () => {
      console.log('SearchForm unmounted');
    };
  }, []);

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
    console.log('handleSearch called:', { 
      eventType: typeof e === 'string' ? 'URL' : e.type,
      artist,
      album,
      currentPage
    });
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
        data = await typedSpotifyApi.searchByUrl(e);
      } else {
        // Otherwise, use the search function
        const offset = (currentPage - 1) * itemsPerPage;
        data = await typedSpotifyApi.searchSpotify(artist, album, offset, itemsPerPage);
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
        const fallbackData = await typedSpotifyApi.searchByArtist(artist, 10);
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

  const fetchAlbumTracks = async (albumId: string, offset: number = 0) => {
    try {
      const data = await typedSpotifyApi.getAlbumTracks(albumId, offset);
      setAlbumTracks(prev => ({
        ...prev,
        [albumId]: offset === 0 ? data.items : [...(prev[albumId] || []), ...data.items]
      }));
      setTracksPagination(prev => ({
        ...prev,
        [albumId]: {
          offset: offset,
          limit: data.limit,
          total: data.total,
          hasMore: data.total > offset + data.items.length
        }
      }));
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  const { showGuidelines, showGuidelinesOnce, acknowledgeGuidelines } = useSpotifyGuidelines();

  // Show guidelines when user first interacts with search results
  useEffect(() => {
    if (albumSearchResults.length > 0 || expandedTracks) {
      showGuidelinesOnce();
    }
  }, [albumSearchResults.length, expandedTracks, showGuidelinesOnce]);

  return (
    <div className="flex flex-col h-full">
      <SpotifyUsageGuidelines 
        isOpen={showGuidelines} 
        onClose={acknowledgeGuidelines} 
      />
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
          <div className="flex flex-col items-center space-y-2">
            <button
              type="submit"
              disabled={isSearching || !isAuthenticated}
              className={`w-1/3 px-4 py-2 rounded-full transition-colors duration-200 flex items-center justify-center ${
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
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z"/>
                </svg>
                Search Spotify
              </>
            )}
            </button>
            <p className="text-xs text-gray-400 flex items-center space-x-2">
              <Image
                src="/spotify-logo.png"
                alt="Spotify"
                width={12}
                height={12}
                className="opacity-75"
              />
              <span>Content is provided through Spotify and subject to their terms of use</span>
            </p>
          </div>
        </form>
        
        {searchError && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-lg">
            {searchError}
          </div>
        )}

        {totalResults > 0 && (
          <div className="flex items-center justify-between text-gray-300 text-sm">
            <div>
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} results
            </div>
            <div className="flex items-center space-x-2">
              <Image
                src="/spotify-logo.png"
                alt="Spotify"
                width={16}
                height={16}
                className="opacity-75"
              />
              <span className="text-gray-400">Results from Spotify</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {albumSearchResults.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No Results Found</div>
        ) : (
          albumSearchResults.filter(album => album !== null).map((spotifyAlbum) => {
            return (
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
                    <a 
                      href={spotifyAlbum.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-white group-hover:text-spotify-green">
                        {spotifyAlbum.name}
                        <svg 
                          className="w-4 h-4 inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z"/>
                        </svg>
                      </h3>
                    </a>
                    <p className="text-gray-400">{spotifyAlbum.release_date}</p>
                    <SpotifyAttribution
                      contentType="album"
                      contentId={spotifyAlbum.id}
                      contentName={spotifyAlbum.name}
                      artistName={spotifyAlbum.artists?.[0]?.name}
                      className="mt-1"
                    />
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
                      <>
                        {albumTracks[spotifyAlbum.id].map((track: SpotifyTrack) => (
                          <div 
                            key={track.id}
                            className="group flex items-center text-sm text-gray-300 p-3 hover:bg-gray-700/50 cursor-move"
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
                            <a 
                              href={`https://open.spotify.com/track/${track.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-4 hover:text-spotify-green"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {track.name}
                              <svg 
                                className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" 
                                fill="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z"/>
                              </svg>
                            </a>
                            <div className="flex items-center ml-auto space-x-4">
                              <SpotifyAttribution
                                contentType="track"
                                contentId={track.id}
                                contentName={track.name}
                                artistName={track.artists?.[0]?.name}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                              <span className="text-gray-500">
                                {Math.floor(track.duration_ms / 60000)}:
                                {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                        ))}
                        {tracksPagination[spotifyAlbum.id]?.hasMore && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentPagination = tracksPagination[spotifyAlbum.id];
                              if (currentPagination) {
                                fetchAlbumTracks(
                                  spotifyAlbum.id,
                                  currentPagination.offset + currentPagination.limit
                                );
                              }
                            }}
                            className="w-full mt-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors duration-200"
                          >
                            Load More Tracks
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-400 text-sm p-4">Loading tracks...</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
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