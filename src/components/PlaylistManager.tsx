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

  return (
    <div className="container mx-auto p-4">
      {selectedPlaylists.size > 0 && (
        <button
          onClick={deleteSelectedPlaylists}
          className="mb-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Delete Selected ({selectedPlaylists.size})
        </button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className={`border p-4 rounded cursor-pointer ${
              selectedPlaylists.has(playlist.id) ? 'border-red-500 bg-red-50' : ''
            }`}
            onClick={() => togglePlaylist(playlist.id)}
          >
            {playlist.images[0] && (
              <img
                src={playlist.images[0].url}
                alt={playlist.name}
                className="w-full h-48 object-cover mb-2 rounded"
              />
            )}
            <h3 className="font-semibold">{playlist.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}