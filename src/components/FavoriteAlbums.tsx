import React, { useState, useRef, useMemo, useEffect } from 'react';
import SearchForm from './SearchForm';
import { Album } from '../types/album';
import Publications from './Publications';
import { spotifyApi } from '../utils/spotifyApi';
import { SpotifyAlbum, SpotifyTrack, SpotifyApi } from '../types/spotify';
import SpotifyAttribution from './SpotifyAttribution';
import SpotifyUsageGuidelines from './SpotifyUsageGuidelines';
import { useSpotifyGuidelines } from '../hooks/useSpotifyGuidelines';
import SpotifyBadge from './SpotifyBadge';

const typedSpotifyApi = spotifyApi as SpotifyApi;

type SortField = 'artist' | 'album' | 'year' | 'rating';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}


export default function FavoriteAlbums() {
  const [activeTab, setActiveTab] = useState<'import' | 'search' | 'publications'>('import');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(40);
  const [sortState, setSortState] = useState<SortState>({ field: 'artist', direction: 'asc' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Record<string, SpotifyAlbum[]>>({});
  const updateSearchResults = (newResults: Record<string, SpotifyAlbum[]>) => {
    setSearchResults(newResults);
  };
  const [albumTracks, setAlbumTracks] = useState<{ [key: string]: SpotifyTrack[] }>({});
  const [expandedTracks, setExpandedTracks] = useState<string | null>(null);
  const [tracksPagination, setTracksPagination] = useState<{
    [key: string]: {
      offset: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }>({});
  const [searchAlbumResults, setSearchAlbumResults] = useState<SpotifyAlbum[]>([]);
  const [searchState, setSearchState] = useState({
    currentPage: 1,
    artist: '',
    album: '',
    nextUrl: null as string | null,
    previousUrl: null as string | null
  });

  // Preserve search results, total results, and pagination URLs along with state
  const [preservedSearchResults, setPreservedSearchResults] = useState<SpotifyAlbum[]>([]);
  const [preservedTotalResults, setPreservedTotalResults] = useState<number>(0);
  const [preservedNextUrl, setPreservedNextUrl] = useState<string | null>(null);
  const [preservedPrevUrl, setPreservedPrevUrl] = useState<string | null>(null);

  // Preserve search state when switching tabs
  const handleTabChange = (tab: 'import' | 'search' | 'publications') => {
    if (tab === 'import') {
      // Save current search results and pagination state before switching to import
      setPreservedSearchResults(searchAlbumResults);
    } else {
      // Restore search results and pagination state when switching back to search
      setSearchAlbumResults(preservedSearchResults);
    }
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

  const handleAlbumClick = async (album: Album) => {
    // If the row is already expanded, collapse it
    if (expandedRow === album.id) {
      setExpandedRow(null);
      return;
    }

    try {
      // First attempt: search with both artist and album
      const data = await typedSpotifyApi.searchByArtistAndAlbum(
        album.artist,
        album.album
      );
      
      // If no results found, try searching with just the artist
      if (data.albums.items.length === 0) {
        console.log('No results found with album name, trying artist-only search');
        const fallbackData = await typedSpotifyApi.searchByArtist(
          album.artist
        );
        updateSearchResults({ [album.id]: fallbackData.albums.items });
      } else {
        updateSearchResults({ [album.id || 'temp']: data.albums.items });
      }
      
      setExpandedRow(album.id || 'temp');
    } catch (error) {
      console.error('Error searching Spotify:', error);
    }
  };

  const { showGuidelines, showGuidelinesOnce, acknowledgeGuidelines } = useSpotifyGuidelines();

  // Show guidelines when user first tries to interact with content
  useEffect(() => {
    if (expandedRow || expandedTracks) {
      showGuidelinesOnce();
    }
  }, [expandedRow, expandedTracks, showGuidelinesOnce]);

  return (
    <div className="h-full flex flex-col">
      <SpotifyUsageGuidelines 
        isOpen={showGuidelines} 
        onClose={acknowledgeGuidelines} 
      />
      <div className="flex items-center justify-between mb-2 sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10 py-1">
        <div className="flex flex-col space-y-2">
          <h2 className="text-xl font-bold text-white">
            {activeTab === 'search' ? 'Search' : 
             activeTab === 'publications' ? 'Music Publications' : 
             'Favourite Albums'}
          </h2>
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
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'publications'
                  ? 'text-spotify-green border-b-2 border-spotify-green'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => handleTabChange('publications')}
            >
              Publications
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'import' && (
            <>
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
            </>
          )}
        </div>
      </div>

      {activeTab === 'publications' ? (
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm overflow-hidden">
             <Publications />
        </div>
      ) : activeTab === 'search' ? (
        <div className="flex-1 overflow-y-auto px-6">
          <SearchForm 
            albumSearchResults={searchAlbumResults}
            setAlbumSearchResults={setSearchAlbumResults}
            initialPage={searchState.currentPage}
            initialArtist={searchState.artist}
            initialAlbum={searchState.album}
            initialTotalResults={preservedTotalResults}
            initialNextUrl={searchState.nextUrl}
            initialPrevUrl={searchState.previousUrl}
            onSearchStateChange={(state) => {
              setSearchState(state);
              setPreservedTotalResults(state.totalResults);
            }}
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
                  {[
                    { field: 'artist', label: 'Artist' },
                    { field: 'album', label: 'Album' },
                    { field: 'year', label: 'Year' },
                    { field: 'rating', label: 'Rating' }
                  ].map(({ field, label }) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field as SortField)}
                      className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors duration-200"
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
                {currentAlbums.filter(album => album !== null).map((album) => (
                  <React.Fragment key={album.id}>
                    <tr
                      className="text-gray-200 hover:bg-gray-600/50 transition-colors duration-200 cursor-pointer"
                      onClick={() => handleAlbumClick(album)}
                      title="Click to view Spotify matches"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{album.artist}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{album.album}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{album.year}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{album.rating}</td>
                    </tr>
                    {expandedRow === album.id && searchResults[album.id] && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 bg-gray-800">
                          {searchResults[album.id].filter(spotifyAlbum => spotifyAlbum !== null).map((spotifyAlbum) => (
                            <div key={spotifyAlbum.id}>
                              <div className="flex items-center justify-between p-1 hover:bg-gray-700 rounded-lg cursor-pointer text-sm">
                                <div
                                  className="flex items-center space-x-2 flex-1"
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
                                    className="w-12 h-12 rounded-md object-cover"
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
                                      artistName={album.artist}
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
                                <div className="mt-2 space-y-1">
                                  {albumTracks[spotifyAlbum.id] ? (
                                    <>
                                      {albumTracks[spotifyAlbum.id].map((track: SpotifyTrack) => (
                                        <div 
                                          key={track.id}
                                          className="group flex items-center text-sm text-gray-300 p-2 hover:bg-gray-700/50 rounded cursor-move"
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
                                              artistName={album.artist}
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
                                          onClick={() => {
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
                                    <div className="text-gray-400 text-sm p-2">Loading tracks...</div>
                                  )}
                                </div>
                              )}
                              </div>
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
            <div className="sticky bottom-0 mt-2 flex items-center justify-between px-3 py-2 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700">
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