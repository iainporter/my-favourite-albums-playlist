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
  const [isLoading, setIsLoading] = useState(false);

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



  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        </div>
      );
    }

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
      <div className="flex-1 overflow-y-auto pr-4 -mr-4 min-h-0">
        <div className="space-y-3 pb-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="group flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-all duration-200"
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

              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg className="w-6 h-6 text-spotify-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
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
      </div>

      {renderContent()}
    </div>
  );
}