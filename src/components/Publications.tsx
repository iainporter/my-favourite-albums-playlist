import React, { useState } from 'react';

interface Album {
  artist: string;
  album: string;
  releaseDate: string;
  rating: string;
}

export default function Publications() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPitchforkAlbums = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://pitchfork.com/reviews/best/high-scoring-albums/');
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
          className="w-48 h-48 bg-black text-white rounded-lg shadow-lg flex items-center justify-center p-4 hover:bg-gray-900 transition-colors duration-200"
          disabled={loading}
        >
          <span className="text-xl font-bold">
            {loading ? 'Loading...' : 'Pitchfork 8.0+ Albums'}
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
          <div className="grid gap-4">
            {albums.map((album, index) => (
              <div 
                key={index} 
                className="bg-gray-800 p-4 rounded-lg shadow-lg"
              >
                <div className="text-white font-bold">{album.artist}</div>
                <div className="text-gray-300">{album.album}</div>
                <div className="text-gray-400 text-sm">
                  Released: {album.releaseDate}
                </div>
                <div className="text-spotify-green font-bold">
                  Rating: {album.rating}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}