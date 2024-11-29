import React, { useState } from 'react';
import { getCachedData, setCachedData } from '../utils/browserCache';
import { spotifyApi } from '../utils/spotifyApi';
import { SpotifyApi } from '../types/spotify';

const typedSpotifyApi = spotifyApi as SpotifyApi;
import { SpotifyAlbum as SpotifyApiAlbum } from '../types/spotify';

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

type PublicationType = 'high-rated' | 'best-new' | 'diy' | 'acclaimed' | 'latest';


export default function Publications() {
  const [albums, setAlbums] = useState<PitchforkAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{ [key: string]: SpotifyAlbum[] }>({});
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null);
  const [albumTracks, setAlbumTracks] = useState<{ [key: string]: SpotifyTrack[] }>({});
  const [expandedTracks, setExpandedTracks] = useState<string | null>(null);
  const [currentList, setCurrentList] = useState<PublicationType | null>(null);
  const [tracksPagination, setTracksPagination] = useState<{
    [key: string]: {
      offset: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }>({});

  const fetchAlbums = async (type: PublicationType) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    try {
      // Check cache first
      const cacheKey = `${type}`;
      const cachedData = getCachedData<PitchforkAlbum[]>(cacheKey);
      if (cachedData) {
        setAlbums(cachedData);
        setCurrentList(type);
        setLoading(false);
        return;
      }

      let url;
      switch (type) {
        case 'high-rated':
          url = '/api/spotify/pitchfork?type=high-rated';
          break;
        case 'best-new':
          url = '/api/spotify/pitchfork?type=best-new';
          break;
        case 'diy':
          url = '/api/spotify/diy';
          break;
        case 'acclaimed':
          url = '/api/spotify/acclaimed';
          break;
        default:
          url = '/api/spotify/pitchfork?type=latest';
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch albums');
      }
      const data = await response.json();
      // Cache the response
      setCachedData(`${type}`, data);
      setAlbums(data);
      setCurrentList(type);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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

  const handleAlbumClick = async (artist: string, album: string) => {
    const searchKey = `${artist}-${album}`;
    if (expandedAlbum === searchKey) {
      setExpandedAlbum(null);
      return;
    }

    setExpandedAlbum(searchKey);
    if (!searchResults[searchKey]) {
      try {
        const data = await typedSpotifyApi.searchSpotify(artist, album);
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
      <div className="p-4 flex gap-4">
        <button
          onClick={() => fetchAlbums('high-rated')}
          className={`w-40 h-16 ${currentList === 'high-rated' ? 'bg-gray-700' : 'bg-black'} text-white rounded-lg shadow-lg flex items-center justify-center p-4 hover:bg-gray-900 transition-colors duration-200`}
          disabled={loading}
        >
          <span className="text-sm font-bold">
            {loading && currentList === 'high-rated' ? 'Loading...' : 'Pitchfork 8.0+ Albums'}
          </span>
        </button>
        <button
          onClick={() => fetchAlbums('best-new')}
          className={`w-40 h-16 ${currentList === 'best-new' ? 'bg-gray-700' : 'bg-black'} text-white rounded-lg shadow-lg flex items-center justify-center p-4 hover:bg-gray-900 transition-colors duration-200`}
          disabled={loading}
        >
          <span className="text-sm font-bold">
            {loading && currentList === 'best-new' ? 'Loading...' : 'Pitchfork Best New Albums'}
          </span>
        </button>
        <button
          onClick={() => fetchAlbums('diy')}
          className={`w-40 h-16 ${currentList === 'diy' ? 'bg-gray-700' : 'bg-black'} text-white rounded-lg shadow-lg flex items-center justify-center p-4 hover:bg-gray-900 transition-colors duration-200`}
          disabled={loading}
        >
          <span className="text-sm font-bold">
            {loading && currentList === 'diy' ? 'Loading...' : 'DIY New Albums'}
          </span>
        </button>
        <button
          onClick={() => fetchAlbums('acclaimed')}
          className={`w-40 h-16 ${currentList === 'acclaimed' ? 'bg-gray-700' : 'bg-black'} text-white rounded-lg shadow-lg flex items-center justify-center p-4 hover:bg-gray-900 transition-colors duration-200`}
          disabled={loading}
        >
          <span className="text-sm font-bold">
            {loading && currentList === 'acclaimed' ? 'Loading...' : 'Acclaimed Music All Time Albums'}
          </span>
        </button>
        <button
          onClick={() => fetchAlbums('latest')}
          className={`w-40 h-16 ${currentList === 'latest' ? 'bg-gray-700' : 'bg-black'} text-white rounded-lg shadow-lg flex items-center justify-center p-4 hover:bg-gray-900 transition-colors duration-200`}
          disabled={loading}
        >
          <span className="text-sm font-bold">
            {loading && currentList === 'latest' ? 'Loading...' : 'Pitchfork Latest Albums'}
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
            <h2 className="text-white text-xl font-bold mb-4">
              {currentList === 'best-new' 
                ? 'Pitchfork Best New Albums' 
                : currentList === 'diy'
                ? 'DIY New Albums'
                : currentList === 'acclaimed'
                ? 'Acclaimed Music All Time Albums'
                : currentList === 'latest'
                ? 'Pitchfork Latest Albums'
                : 'Pitchfork 8.0+ Albums'}
            </h2>
            <div className="flex-1 overflow-y-auto min-h-0">
              {albums.map((album, index) => (
                <div key={index}>
                  <div
                    onClick={() => handleAlbumClick(album.artist, album.album)}
                    className="text-white py-2 px-4 hover:bg-gray-700 rounded transition-colors duration-200 mb-2 cursor-pointer"
                  >
                    <div className="font-bold">{album.artist}</div>
                    <div className="text-gray-300">{album.album}</div>
                    <div className="text-sm text-gray-400">
                      {currentList === 'acclaimed' && (album as any).year 
                        ? (album as any).year 
                        : album.publishDate}
                    </div>
                  </div>
                  {expandedAlbum === `${album.artist}-${album.album}` && (
                    <div className="ml-4 mb-4 p-4 bg-gray-700 rounded">
                      {searchResults[`${album.artist}-${album.album}`]?.filter(album => album != null).map((spotifyAlbum) => (
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
                            draggable="true"
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify({
                                id: spotifyAlbum.id,
                                name: spotifyAlbum.name,
                                artist: spotifyAlbum.artists[0].name,
                                releaseDate: spotifyAlbum.release_date,
                                image: spotifyAlbum.images[0]?.url,
                                uri: spotifyAlbum.uri
                              }));
                              e.dataTransfer.effectAllowed = 'copy';
                              const dragIcon = document.createElement('div');
                              dragIcon.className = 'bg-gray-800 text-white p-2 rounded shadow';
                              dragIcon.innerHTML = `${spotifyAlbum.artists[0].name} - ${spotifyAlbum.name}`;
                              document.body.appendChild(dragIcon);
                              e.dataTransfer.setDragImage(dragIcon, 0, 0);
                              setTimeout(() => document.body.removeChild(dragIcon), 0);
                            }}
                          >
                            <div className="flex items-center">
                              {spotifyAlbum.images[0] && (
                                <img
                                  src={spotifyAlbum.images[0].url}
                                  alt={spotifyAlbum.name}
                                  className="w-12 h-12"
                                />
                              )}
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(spotifyAlbum.external_urls.spotify, '_blank');
                                }}
                                className="ml-2 p-2 hover:bg-gray-600 rounded-full cursor-pointer"
                                title="Play on Spotify"
                              >
                                <svg 
                                  className="w-6 h-6 text-green-500" 
                                  fill="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-gray-300 text-m">
                                {spotifyAlbum.artists.map(a => a.name).join(', ')}
                              </div>
                              <div className="text-white font-semibold">{spotifyAlbum.name}</div>
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
                                <>
                                  {albumTracks[spotifyAlbum.id].map((track: SpotifyTrack) => (
                                    <div 
                                      key={track.id}
                                      className="flex items-center text-sm text-gray-300 p-2 hover:bg-gray-600 rounded cursor-move"
                                      draggable="true"
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData('application/json', JSON.stringify({
                                          id: track.id,
                                          name: track.name,
                                          artist: track.artists[0].name,
                                          album: spotifyAlbum.name,
                                          duration: track.duration_ms,
                                          uri: `spotify:track:${track.id}`
                                        }));
                                        e.dataTransfer.effectAllowed = 'copy';
                                        const dragIcon = document.createElement('div');
                                        dragIcon.className = 'bg-gray-800 text-white p-2 rounded shadow';
                                        dragIcon.innerHTML = `${track.name} - ${track.artists[0].name}`;
                                        document.body.appendChild(dragIcon);
                                        e.dataTransfer.setDragImage(dragIcon, 0, 0);
                                        setTimeout(() => document.body.removeChild(dragIcon), 0);
                                      }}
                                    >
                                      <span className="w-8 text-right text-gray-500">{track.track_number}.</span>
                                      <span className="ml-4">{track.name}</span>
                                      <span className="ml-auto text-gray-500">
                                        {Math.floor(track.duration_ms / 60000)}:
                                        {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                                      </span>
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
                                      className="w-full mt-2 px-4 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors duration-200"
                                    >
                                      Load More Tracks
                                    </button>
                                  )}
                                </>
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