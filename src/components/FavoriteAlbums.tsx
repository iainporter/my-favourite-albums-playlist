import { useState, useRef } from 'react';
import { Album } from '../types/album';

export default function FavoriteAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAlbums = albums.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(albums.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n');
      const parsedAlbums: Album[] = rows
        .slice(1) // Skip header row
        .filter(row => row.trim()) // Skip empty rows
        .map((row, index) => {
          const [artist, album, year, rating] = row.split(',').map(field => field.trim());
          return {
            id: `imported-${index}`,
            artist,
            album,
            year,
            rating
          };
        });
      setAlbums(parsedAlbums);
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10 py-2">
        <h2 className="text-2xl font-bold text-white">My Favourite Albums</h2>
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

      {albums.length === 0 ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Artist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Album</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Rating</th>
                </tr>
              </thead>
              <tbody className="bg-gray-700 divide-y divide-gray-600">
                {currentAlbums.map((album) => (
                  <tr key={album.id} className="text-gray-200">
                    <td className="px-6 py-4 whitespace-nowrap">{album.artist}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{album.album}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{album.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{album.rating}</td>
                  </tr>
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