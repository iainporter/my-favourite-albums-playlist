import React, { useState, useRef, useMemo, useEffect } from 'react';
import SearchForm from './SearchForm';
import { Analytics } from "@vercel/analytics/react"
import { Album } from '../types/album';

type SortField = 'artist' | 'album' | 'year' | 'rating';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

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

interface FavoriteAlbumsProps {
  accessToken: string;
}

export default function FavoriteAlbums({ accessToken }: FavoriteAlbumsProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'search'>('import');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortState, setSortState] = useState<SortState>({ field: 'artist', direction: 'asc' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{ [key: string]: SpotifyAlbum[] }>({});
  const [albumTracks, setAlbumTracks] = useState<{ [key: string]: SpotifyTrack[] }>({});
  const [expandedTracks, setExpandedTracks] = useState<string | null>(null);
  const [searchAlbumResults, setSearchAlbumResults] = useState<SpotifyAlbum[]>([]);
  const [searchState, setSearchState] = useState({
    currentPage: 1,
    artist: '',
    album: ''
  });

  // Preserve search state when switching tabs
  const handleTabChange = (tab: 'import' | 'search') => {
    setActiveTab(tab);
  };

  const handleSort = (field: SortField) => {
    setSortState(prevState => ({
      field,
      direction: prevState.field === field && prevState.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  const sortedAlbums = useMemo(() => {
    const sorted = [...albums].sort((a, b) => {
      const aValue = String(a[sortState.field]).toLowerCase();
      const bValue = String(b[sortState.field]).toLowerCase();

      if (sortState.field === 'year' || sortState.field === 'rating') {
        // Handle numeric sorting
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        return sortState.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Handle string sorting
      if (aValue < bValue) return sortState.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortState.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [albums, sortState]);

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAlbums = sortedAlbums.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedAlbums.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let inQuotes = false;
    let currentField = '';
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Handle escaped quotes
          currentField += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
      i++;
    }

    // Add the last field
    result.push(currentField.trim());
    return result;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Split by newline but handle both \r\n and \n
      const rows = text.split(/\r?\n/);
      setActiveTab('import');

      try {
        // Validate header row
        const headerRow = parseCSVLine(rows[0]);
        const expectedHeaders = ['Artist', 'Album', 'Year', 'Rating'];
        const headersValid = expectedHeaders.every((header, index) =>
          headerRow[index]?.toLowerCase() === header.toLowerCase()
        );

        if (!headersValid) {
          alert('Invalid CSV format. Please ensure the first row contains: Artist, Album, Year, Rating');
          return;
        }

        const parsedAlbums: Album[] = rows
          .slice(1) // Skip header row
          .filter(row => row.trim()) // Skip empty rows
          .map((row, index) => {
            const [artist, album, year, rating] = parseCSVLine(row);
            if (!artist || !album) {
              throw new Error(`Invalid row ${index + 2}: Artist and Album are required`);
            }
            return {
              id: `imported-${index}`,
              artist,
              album,
              year: year?.trim() || '',
              rating: rating?.trim() || ''
            };
          });

        setAlbums(parsedAlbums);
        setCurrentPage(1); // Reset to first page
        setSortState({ field: 'artist', direction: 'asc' }); // Reset sort
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please ensure the file is properly formatted.');
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event
    setAlbums(albums.filter(album => album.id !== albumId));
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

  const handleAlbumClick = async (album: Album) => {
    try {
      // First attempt: search with both artist and album
      const fullQuery = `artist:${album.artist} album:${album.album}`;
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(fullQuery)}&type=album&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to search Spotify');
      }
      
      const data = await response.json();
      
      // If no results found, try searching with just the artist
      if (data.albums.items.length === 0) {
        console.log('No results found with album name, trying artist-only search');
        const artistQuery = `artist:${album.artist}`;
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
        setSearchResults({ [album.id]: fallbackData.albums.items });
      } else {
        setSearchResults({ [album.id || 'temp']: data.albums.items });
      }
      
      setExpandedRow(album.id || 'temp');
    } catch (error) {
      console.error('Error searching Spotify:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10 py-2">
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-bold text-white">My Favourite Albums</h2>
          <div className="flex space-x-4 border-b border-gray-700">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'import'
                  ? 'text-spotify-green border-b-2 border-spotify-green'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => handleTabChange('import')}
            >
              Import
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'search'
                  ? 'text-spotify-green border-b-2 border-spotify-green'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => handleTabChange('search')}
            >
              Search
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2"
            onClick={() => {
              const sampleData = `Artist,Album,Year,Rating
"The Beatles","Abbey Road","1969","5"
"Pink Floyd","Dark Side of the Moon","1973","5"
"David Bowie","The Rise and Fall of Ziggy Stardust","1972","5"`;

              const blob = new Blob([sampleData], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'sample_albums.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>Download Sample</span>
          </button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            className="px-4 py-2 bg-spotify-green text-white rounded-full hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Import Albums</span>
          </button>
        </div>
      </div>

      {activeTab === 'search' ? (
        <div className="flex-1 overflow-y-auto px-6">
          <SearchForm 
            accessToken={accessToken}
            albumSearchResults={searchAlbumResults}
            setAlbumSearchResults={setSearchAlbumResults}
            initialPage={searchState.currentPage}
            initialArtist={searchState.artist}
            initialAlbum={searchState.album}
            onSearchStateChange={setSearchState}
          />
        </div>
      ) : albums.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-lg">No albums added yet</p>
            <p className="text-sm mt-2">Import your favorite albums to get started</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-800 text-white">
                  <th className="w-12"></th>
                  {[
                    { field: 'artist', label: 'Artist' },
                    { field: 'album', label: 'Album' },
                    { field: 'year', label: 'Year' },
                    { field: 'rating', label: 'Rating' }
                  ].map(({ field, label }) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field as SortField)}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-1">
                        <span>{label}</span>
                        <div className="flex flex-col">
                          <svg
                            className={`w-3 h-3 ${
                              sortState.field === field && sortState.direction === 'asc'
                                ? 'text-spotify-green'
                                : 'text-gray-400'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
                          </svg>
                          <svg
                            className={`w-3 h-3 ${
                              sortState.field === field && sortState.direction === 'desc'
                                ? 'text-spotify-green'
                                : 'text-gray-400'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
                          </svg>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-gray-700 divide-y divide-gray-600">
                {currentAlbums.map((album) => (
                  <React.Fragment key={album.id}>
                    <tr
                      className="text-gray-200 hover:bg-gray-600/50 transition-colors duration-200 cursor-pointer"
                      onClick={() => handleAlbumClick(album)}
                      title="Click to view Spotify matches"
                    >
                      <td className="px-6 py-4 whitespace-nowrap w-12">
                        <button
                          onClick={(e) => handleDelete(album.id, e)}
                          className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                          title="Delete album"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{album.artist}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{album.album}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{album.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{album.rating}</td>
                    </tr>
                    {expandedRow === album.id && searchResults[album.id] && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-800">
                          {searchResults[album.id].map((spotifyAlbum) => (
                            <div key={spotifyAlbum.id}>
                              <div 
                                className="flex items-center space-x-4 p-2 hover:bg-gray-700 rounded-lg cursor-pointer"
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
                                    artist: album.artist,
                                    releaseDate: spotifyAlbum.release_date,
                                    image: spotifyAlbum.images[0]?.url,
                                    uri: spotifyAlbum.uri
                                  }));
                                  e.dataTransfer.effectAllowed = 'copy';
                                  const dragIcon = document.createElement('div');
                                  dragIcon.className = 'bg-gray-800 text-white p-2 rounded shadow';
                                  dragIcon.innerHTML = `${album.artist} - ${spotifyAlbum.name}`;
                                  document.body.appendChild(dragIcon);
                                  e.dataTransfer.setDragImage(dragIcon, 0, 0);
                                  setTimeout(() => document.body.removeChild(dragIcon), 0);
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
                                <div className="mt-2 space-y-1">
                                  {albumTracks[spotifyAlbum.id] ? (
                                    albumTracks[spotifyAlbum.id].map((track: SpotifyTrack) => (
                                      <div 
                                        key={track.id}
                                        className="flex items-center text-sm text-gray-300 p-2 hover:bg-gray-700/50 rounded cursor-move"
                                        draggable="true"
                                        onDragStart={(e) => {
                                          e.dataTransfer.setData('application/json', JSON.stringify({
                                            id: track.id,
                                            name: track.name,
                                            artist: album.artist,
                                            album: spotifyAlbum.name,
                                            duration: track.duration_ms,
                                            uri: `spotify:track:${track.id}`
                                          }));
                                          e.dataTransfer.effectAllowed = 'copy';
                                          const dragIcon = document.createElement('div');
                                          dragIcon.className = 'bg-gray-800 text-white p-2 rounded shadow';
                                          dragIcon.innerHTML = `${track.name} - ${album.artist}`;
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
                                    ))
                                  ) : (
                                    <div className="text-gray-400 text-sm p-2">Loading tracks...</div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {albums.length > 0 && (
            <div className="sticky bottom-0 mt-4 flex items-center justify-between px-6 py-3 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700">
              <div className="flex items-center text-sm text-gray-400">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, albums.length)} of {albums.length} albums
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-full flex items-center space-x-2 ${
                    currentPage === 1
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-spotify-green text-white hover:bg-green-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous</span>
                </button>
                <span className="text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-full flex items-center space-x-2 ${
                    currentPage === totalPages
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-spotify-green text-white hover:bg-green-600'
                  }`}
                >
                  <span>Next</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}