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
      setPlaylists(data.items);
    } catch (error) {
      console.error('Error fetching playlists:', error);
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

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-6">
        {selectedPlaylists.size > 0 && (
          <div className="sticky top-4 z-10 flex justify-center">
            <button
              onClick={deleteSelectedPlaylists}
              className="group relative inline-flex items-center px-6 py-3 text-base font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <span className="mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              Delete Selected ({selectedPlaylists.size})
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => togglePlaylist(playlist.id)}
              className={`group relative overflow-hidden rounded-xl bg-gray-800/50 backdrop-blur-sm transition-all duration-300 hover:transform hover:scale-105 cursor-pointer
                ${selectedPlaylists.has(playlist.id) 
                  ? 'ring-2 ring-red-500 bg-red-900/20' 
                  : 'hover:ring-2 hover:ring-green-500/50'}`}
            >
              <div className="aspect-square overflow-hidden">
                {playlist.images[0] ? (
                  <img
                    src={playlist.images[0].url}
                    alt={playlist.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="font-bold text-lg text-white truncate">{playlist.name}</h3>
              </div>

              {selectedPlaylists.has(playlist.id) && (
                <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}