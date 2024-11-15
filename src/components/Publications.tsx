import React, { useState } from 'react';

interface PitchforkAlbum {
  artist: string;
  album: string;
  publishDate: string;
}

export default function Publications() {
  const [albums, setAlbums] = useState<PitchforkAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPitchforkAlbums = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/spotify/pitchfork');
      if (!response.ok) {
        throw new Error('Failed to fetch albums');
      }
      const data = await response.json();
      setAlbums(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4">
        <button 
          onClick={fetchPitchforkAlbums}
          className="w-40 h-16 bg-black text-white rounded-lg shadow-lg flex items-center justify-center p-4 hover:bg-gray-900 transition-colors duration-200"
          disabled={loading}
        >
          <span className="text-sm font-bold">
            {loading ? 'Loading...' : 'Pitchfork 8.0+ new Albums'}
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
            <h2 className="text-white text-xl font-bold mb-4">Pitchfork Albums</h2>
            <div className="max-h-96 overflow-y-auto">
              {albums.map((album, index) => (
                <div 
                  key={index} 
                  className="text-white py-2 px-4 hover:bg-gray-700 rounded transition-colors duration-200 mb-2"
                >
                  <div className="font-bold">{album.artist}</div>
                  <div className="text-gray-300">{album.album}</div>
                  <div className="text-sm text-gray-400">{album.publishDate}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}