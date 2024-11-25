import { useState, useEffect, useRef } from 'react';
import { Analytics } from "@vercel/analytics/react";
import { spotifyApi } from '../utils/spotifyApi';
import { SpotifyApi } from '../types/spotify';
import { logger } from '../utils/logger';


const typedSpotifyApi = spotifyApi as SpotifyApi;

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, isPrivate: boolean) => void;
}

function CreatePlaylistModal({ isOpen, onClose, onSubmit }: CreatePlaylistModalProps) {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(playlistName, playlistDescription, isPrivate);
    setPlaylistName('');
    setPlaylistDescription('');
    setIsPrivate(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold text-white mb-4">Create New Playlist</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            placeholder="Enter playlist name"
            className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-spotify-green focus:outline-none mb-4"
            required
          />
          <textarea
            value={playlistDescription}
            onChange={(e) => setPlaylistDescription(e.target.value)}
            placeholder="Enter playlist description (optional)"
            className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-spotify-green focus:outline-none mb-4 resize-none"
            rows={3}
          />
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="private-playlist"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 text-spotify-green bg-gray-700 border-gray-600 rounded focus:ring-spotify-green focus:ring-2"
            />
            <label htmlFor="private-playlist" className="ml-2 text-sm text-gray-300">
              Make playlist private
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-white hover:bg-gray-700 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-spotify-green text-white rounded-full hover:bg-green-600 transition-colors duration-200"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration_ms: number;
  uri: string;
}

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks?: Track[];
  isExpanded?: boolean;
  paginationInfo?: {
    limit: number;
    next: string | null;
    previous: string | null;
    total: number;
    offset: number;
  };
}


function formatDuration(ms: number | undefined): string {
  if (!ms) return '0:00';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function TrackList({ tracks, playlistId, onRemoveTrack }: { 
  tracks: Track[], 
  playlistId: string, 
  onRemoveTrack: (trackId: string) => void
}) {
  return (
    <div className="overflow-y-auto" style={{ height: 'calc(2.5rem * 10 + 2.5rem)' }}>
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800/50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Artist</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Track</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Album</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 bg-gray-800/30">
          {tracks.map((track) => (
            <tr key={track.id} className="hover:bg-gray-700/50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                <button
                  onClick={() => onRemoveTrack(track.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                  title="Remove from playlist"
                >
                  -
                </button>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{track.artist}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{track.name}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{track.album}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{formatDuration(track.duration_ms)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlaylistItem({ playlist, onToggle, isLoading, onDrop, isAddingTracks, onRemoveTrack, onPageChange }: {
  playlist: Playlist;
  onToggle: () => void;
  isLoading: boolean;
  onDrop: (e: React.DragEvent, playlistId: string) => void;
  isAddingTracks?: boolean;
  onRemoveTrack: (playlistId: string, trackId: string) => void;
  onPageChange?: (playlistId: string, offset: number) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (onDrop) {
      onDrop(e, playlist.id);
    }
  };
  return (
    <div className="mb-4">
      <div
        onClick={onToggle}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e)}
        className={`group flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-all duration-200 cursor-pointer ${
          isDragOver ? 'bg-gray-700/50 border-2 border-spotify-green' : ''
        }`}
      >
        <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
          {playlist.images?.[0] ? (
            <img
              src={playlist.images[0].url}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-white truncate">{playlist.name}</h3>
        </div>

        <div className="flex-shrink-0 transition-transform duration-200">
          <svg
            className={`w-6 h-6 text-spotify-green transform ${playlist.isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </div>

      {isLoading && (
        <div className="mt-4 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-spotify-green"></div>
          <span className="text-gray-400">Loading tracks...</span>
        </div>
      )}

      {playlist.isExpanded && playlist.tracks && (
        <div className="mt-4">
          <div className="bg-gray-800/30 rounded-lg overflow-hidden">
            <TrackList 
              tracks={playlist.tracks} 
              playlistId={playlist.id}
              onRemoveTrack={(trackId) => onRemoveTrack(playlist.id, trackId)}
            />
          </div>
          {playlist.paginationInfo && (
            <div className="mt-2 px-4 py-2 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      if (playlist.paginationInfo && onPageChange) {
                        const newOffset = Math.max(0, playlist.paginationInfo.offset - playlist.paginationInfo.limit);
                        onPageChange(playlist.id, newOffset);
                      }
                    }}
                    disabled={!playlist.paginationInfo.previous}
                    className={`flex items-center space-x-1 ${!playlist.paginationInfo.previous ? 'opacity-50 cursor-not-allowed' : 'hover:text-white cursor-pointer'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Previous</span>
                  </button>
                  <span>
                    Showing {playlist.paginationInfo.offset + 1}-{Math.min(playlist.paginationInfo.offset + playlist.paginationInfo.limit, playlist.paginationInfo.total)} of {playlist.paginationInfo.total} tracks
                  </span>
                  <button
                    onClick={() => onPageChange?.(playlist.id, playlist.paginationInfo!.offset + playlist.paginationInfo!.limit)}
                    disabled={!playlist.paginationInfo.next}
                    className={`flex items-center space-x-1 ${!playlist.paginationInfo.next ? 'opacity-50 cursor-not-allowed' : 'hover:text-white cursor-pointer'}`}
                  >
                    <span>Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NoPlaylists({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-2">No playlists available</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-spotify-green text-white rounded-full hover:bg-green-600 transition-colors duration-200"
        >
          Refresh Playlists
        </button>
      </div>
    </div>
  );
}

export default function PlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState<string | null>(null);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [totalPlaylists, setTotalPlaylists] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleRemoveTrack = async (playlistId: string, trackId: string) => {
    try {
      logger.debug(`Removing track ${trackId} from Playlist ${playlistId}`);
      await typedSpotifyApi.removeItemFromPlaylist(playlistId, `spotify:track:${trackId}`);

      // Get the current playlist and its pagination info
      const currentPlaylist = playlists.find(p => p.id === playlistId);
      const currentPaginationInfo = currentPlaylist?.paginationInfo;
      
      if (!currentPaginationInfo) {
        throw new Error('No pagination info found');
      }

      // Calculate new total and offset
      const newTotal = currentPaginationInfo.total - 1;
      let newOffset = currentPaginationInfo.offset;
      
      // If we're on the last page and removed the last item, go to previous page
      if (newOffset >= newTotal && newOffset > 0) {
        newOffset = Math.max(0, newOffset - currentPaginationInfo.limit);
      }

      // Update the playlist in the UI with adjusted offset
      const tracksData = await typedSpotifyApi.getPlaylistItems(playlistId, newOffset);
      
      if (!tracksData) {
        console.error('No tracks data received');
        throw new Error('Failed to fetch updated playlist tracks');
      }

      const items = tracksData.items || [];
      
      // Transform the tracks data to match the expected Track format
      const transformedTracks = items
        .filter((item: any) => item && item.track)
        .map((item: any) => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists.map((a: any) => a.name).join(', '),
          album: item.track.album.name,
          duration_ms: item.track.duration_ms,
          uri: item.track.uri
        }));

      // Create updated pagination info with adjusted total and offset
      const paginationInfo = {
        limit: tracksData.limit,
        next: newOffset + tracksData.limit < newTotal ? 'next' : null,
        previous: newOffset > 0 ? 'prev' : null,
        total: newTotal,
        offset: newOffset
      };

      // Update the playlist with both new tracks and pagination info
      setPlaylists(currentPlaylists => currentPlaylists.map(p =>
        p.id === playlistId
          ? { ...p, tracks: transformedTracks, paginationInfo }
          : p
      ));
    } catch (error) {
      console.error('Error removing track:', error);
      alert('Failed to remove track from playlist. Please try again.');
    }
  };

  const handleDrop = async (e: React.DragEvent, targetPlaylistId: string) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    
    try {
      setAddingToPlaylist(targetPlaylistId);
      const item = JSON.parse(data);
      
      // Check if the item is a track or an album
      const isTrack = item.uri?.startsWith('spotify:track:');

      if (isTrack) {
        // If it's a track, add it directly to the playlist
        await typedSpotifyApi.addToPlaylist(targetPlaylistId, item.uri);
      } else {
        // If it's an album, get all tracks from the album
        const albumTracks = await typedSpotifyApi.getAlbumTracks(item.id);
        
        // Add each track to the playlist
        for (const track of albumTracks.items) {
          await typedSpotifyApi.addToPlaylist(targetPlaylistId, track.uri);
        }
      }
      
      // Get the current playlist and its pagination info
      const currentPlaylist = playlists.find(p => p.id === targetPlaylistId);
      const currentOffset = currentPlaylist?.paginationInfo?.offset || 0;
      
      // Fetch the updated tracks for the target playlist
      const tracksData = await typedSpotifyApi.getPlaylistItems(targetPlaylistId, currentOffset);
      
      // Transform the tracks data to match the expected Track format
      const transformedTracks = tracksData.items.map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(', '),
        album: item.track.album.name,
        duration_ms: item.track.duration_ms,
        uri: item.track.uri
      }));

      // Create updated pagination info
      const paginationInfo = {
        limit: tracksData.limit,
        next: tracksData.next,
        previous: tracksData.previous,
        total: tracksData.total,
        offset: tracksData.offset || 0
      };

      // Update the playlists state with the new tracks and pagination info
      setPlaylists(currentPlaylists => currentPlaylists.map(p =>
        p.id === targetPlaylistId
          ? { ...p, tracks: transformedTracks, isExpanded: true, paginationInfo }
          : { ...p, isExpanded: false }
      ));
    } catch (error) {
      console.error('Error handling drop:', error);
      alert('Failed to add album tracks to playlist. Please try again.');
    } finally {
      setAddingToPlaylist(null);
    }
  };

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const data = await typedSpotifyApi.getUserPlaylists(offset, itemsPerPage);

      if (data && data.items && Array.isArray(data.items)) {
        setPlaylists(data.items);
        setTotalPlaylists(data.total);
        
        // Calculate if there should be next/previous pages
        const hasNextPage = offset + data.items.length < data.total;
        const hasPrevPage = currentPage > 1;
        
        setNextUrl(hasNextPage ? 'next' : null);
        setPrevUrl(hasPrevPage ? 'prev' : null);
      } else {
        console.error('Invalid playlist data format:', data);
        setPlaylists([]);
        setNextUrl(null);
        setPrevUrl(null);
        setTotalPlaylists(0);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setPlaylists([]);
      setNextUrl(null);
      setPrevUrl(null);
      setTotalPlaylists(0);
    }
    setIsLoading(false);
  };

  const loadPlaylistTracks = async (playlistId: string, offset: number = 0) => {
    setLoadingTracks(playlistId);
    try {
      const data = await typedSpotifyApi.getPlaylistItems(playlistId, offset);
      
      // Transform the Spotify API response into our Track format
      const transformedTracks = data.items.map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(', '),
        album: item.track.album.name,
        duration_ms: item.track.duration_ms,
        uri: item.track.uri
      }));

      const paginationInfo = {
        limit: data.limit,
        next: data.next,
        previous: data.previous,
        total: data.total,
        offset: data.offset || 0
      };

      setPlaylists(playlists.map(p =>
        p.id === playlistId
          ? { 
              ...p, 
              tracks: transformedTracks, 
              isExpanded: true,
              paginationInfo: paginationInfo 
            }
          : p
      ));
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
    setLoadingTracks(null);
  };

  const togglePlaylist = async (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    if (playlist.isExpanded) {
      // Collapse the playlist
      setPlaylists(playlists.map(p =>
        p.id === playlistId ? { ...p, isExpanded: false } : p
      ));
      return;
    }

    // Expand and load tracks if not loaded
    await loadPlaylistTracks(playlistId);
  };

  const handlePlaylistTrackPageChange = async (playlistId: string, offset: number) => {
    // Ensure offset is not negative
    const validOffset = Math.max(0, offset);
    // Get the current playlist
    const playlist = playlists.find(p => p.id === playlistId);
    await loadPlaylistTracks(playlistId, validOffset);
  };

  useEffect(() => {
      fetchPlaylists();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderContent = () => {
    if (!Array.isArray(playlists) || playlists.length === 0) {
      return <NoPlaylists onRefresh={fetchPlaylists} />;
    }

    return (
      <div className="space-y-3 pb-4">
        {playlists.map((playlist) => (
          <PlaylistItem
            key={playlist.id}
            playlist={playlist}
            onToggle={() => togglePlaylist(playlist.id)}
            isLoading={loadingTracks === playlist.id}
            isAddingTracks={addingToPlaylist === playlist.id}
            onDrop={handleDrop}
            onRemoveTrack={handleRemoveTrack}
            onPageChange={handlePlaylistTrackPageChange}
          />
        ))}
      </div>
    );
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreatePlaylist = async (name: string, description: string, isPrivate: boolean) => {
    try {
      await typedSpotifyApi.createPlaylist(name, description, isPrivate);
      setIsCreateModalOpen(false);
      await fetchPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist. Please try again.');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">My Playlists</h2>
            <p className="text-sm text-gray-400 mt-1">
              Showing {playlists.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-
              {playlists.length > 0 ? Math.min(currentPage * itemsPerPage, totalPlaylists) : 0} of {totalPlaylists} results
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-spotify-green text-white rounded-full hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Playlist</span>
          </button>
        </div>
      </div>
      
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePlaylist}
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-4 -mr-4 min-h-0">
          {renderContent()}
        </div>
      )}
      
      {/* Navigation buttons at the bottom */}
      <div className="sticky bottom-0 bg-gray-800/95 backdrop-blur-sm py-3 border-t border-gray-700">
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => {
              setCurrentPage(prev => Math.max(1, prev - 1));
            }}
            disabled={currentPage <= 1 || isLoading}
            className={`px-4 py-2 rounded-full transition-colors duration-200 flex items-center space-x-2 ${
              currentPage > 1 && !isLoading
                ? 'bg-spotify-green text-white hover:bg-green-600'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous</span>
          </button>
          <span className="text-gray-300">Page {currentPage} of {Math.ceil(totalPlaylists / itemsPerPage)}</span>
          <button
            onClick={() => {
              setCurrentPage(prev => Math.min(Math.ceil(totalPlaylists / itemsPerPage), prev + 1));
            }}
            disabled={currentPage >= Math.ceil(totalPlaylists / itemsPerPage) || isLoading}
            className={`px-4 py-2 rounded-full transition-colors duration-200 flex items-center space-x-2 ${
              currentPage < Math.ceil(totalPlaylists / itemsPerPage) && !isLoading
                ? 'bg-spotify-green text-white hover:bg-green-600'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Next</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}