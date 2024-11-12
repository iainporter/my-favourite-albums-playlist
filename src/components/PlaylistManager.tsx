import { useState, useEffect } from 'react';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
}

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks?: Track[];
  isExpanded?: boolean;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface PlaylistManagerProps {
  accessToken: string;
}

export default function PlaylistManager({ accessToken }: PlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState<string | null>(null);

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
    setLoadingTracks(playlistId);
    try {
      const response = await fetch(`/api/spotify/playlists?access_token=${accessToken}&playlist_id=${playlistId}`);
      const data = await response.json();
      
      setPlaylists(playlists.map(p => 
        p.id === playlistId 
          ? { ...p, tracks: data.items, isExpanded: true }
          : { ...p, isExpanded: false }
      ));
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
    setLoadingTracks(null);
  };
  };

  useEffect(() => {
    if (accessToken && accessToken.length > 0) {
      console.log('Access token available, fetching playlists...');
      fetchPlaylists();
    } else {
      console.log('No access token available');
    }
  }, [accessToken]);  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching playlists with token:', accessToken);
      const response = await fetch(`/api/spotify/playlists?access_token=${accessToken}`);
      const data = await response.json();
      console.log('Received playlist data:', data);
      
      if (data && data.items && Array.isArray(data.items)) {
        console.log('Setting playlists:', data.items);
        setPlaylists(data.items);
      } else {
        console.error('Invalid playlist data format:', data);
        setPlaylists([]);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setPlaylists([]);
    }
    setIsLoading(false);
  };



  const renderPlaylists = () => {
    if (!Array.isArray(playlists) || playlists.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-2">No playlists available</p>
            <button
              onClick={fetchPlaylists}
              className="px-4 py-2 bg-spotify-green text-white rounded-full hover:bg-green-600 transition-colors duration-200"
            >
              Refresh Playlists
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 pb-4">
        {playlists.map((playlist) => (
            <div key={playlist.id} className="mb-4">
              <div
                onClick={() => togglePlaylist(playlist.id)}
                className="group flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-all duration-200 cursor-pointer"
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

              {loadingTracks === playlist.id && (
                <div className="ml-24 mt-4 flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-spotify-green"></div>
                  <span className="text-gray-400">Loading tracks...</span>
                </div>
              )}

              {playlist.isExpanded && playlist.tracks && (
                <div className="ml-24 mt-4">
                  <div className="bg-gray-800/30 rounded-lg overflow-hidden">
                    <div className="overflow-y-auto" style={{ height: 'calc(2.5rem * 10 + 2.5rem)' }}>
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800/50 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Track</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Artist</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Album</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 bg-gray-800/30">
                          {playlist.tracks.map((track) => (
                            <tr key={track.id} className="hover:bg-gray-700/50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{track.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{track.artist}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{track.album}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{formatDuration(track.duration)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-800/50 px-4 py-2 border-t border-gray-700">
                      <div className="text-sm text-gray-400">
                        {playlist.tracks.length} tracks
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10 py-2">
        <h2 className="text-2xl font-bold text-white">My Playlists</h2>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-4 -mr-4 min-h-0">
          {renderPlaylists()}
        </div>
      )}
    </div>
  );
}