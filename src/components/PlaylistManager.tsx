import { useState, useEffect } from 'react';

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
}

interface PlaylistManagerProps {
  accessToken: string;
}

export default function PlaylistManager({ accessToken }: PlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (accessToken) {
      fetchPlaylists();
    }
  }, [accessToken]);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/spotify/playlists?access_token=${accessToken}`);
      const data = await response.json();
      if (data && Array.isArray(data.items)) {
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

  const togglePlaylist = (playlistId: string) => {
    const newSelected = new Set(selectedPlaylists);
    if (newSelected.has(playlistId)) {
      newSelected.delete(playlistId);
    } else {
      newSelected.add(playlistId);
    }
    setSelectedPlaylists(newSelected);
  };

  const deleteSelectedPlaylists = async () => {
    setIsLoading(true);
    try {
      for (const playlistId of selectedPlaylists) {
        await fetch('/api/spotify/playlists?access_token=' + accessToken, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ playlist_id: playlistId }),
        });
      }
      await fetchPlaylists();
      setSelectedPlaylists(new Set());
    } catch (error) {
      console.error('Error deleting playlists:', error);
    }
    setIsLoading(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        </div>
      );
    }

    if (!Array.isArray(playlists)) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">No playlists available</p>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto pr-4 -mr-4 min-h-0">
        <div className="space-y-3 pb-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => togglePlaylist(playlist.id)}
              className={`group flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-all duration-200
                ${selectedPlaylists.has(playlist.id)
                  ? 'bg-red-900/20 ring-1 ring-red-500'
                  : 'hover:bg-gray-800/50'
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

              <div className={`flex-shrink-0 ${selectedPlaylists.has(playlist.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}>
                {selectedPlaylists.has(playlist.id) ? (
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                )}
              </div>
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
        {selectedPlaylists.size > 0 && (
          <button
            onClick={deleteSelectedPlaylists}
            className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete ({selectedPlaylists.size})</span>
          </button>
        )}
      </div>

      {renderContent()}
    </div>
  );
}