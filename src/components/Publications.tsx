import React from 'react';

export default function Publications() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <a 
        href="https://pitchfork.com/reviews/best/high-scoring-albums/"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex flex-col items-center hover:scale-105 transition-transform duration-200"
      >
        <button className="w-48 h-48 bg-black text-white rounded-lg shadow-lg flex items-center justify-center p-4 hover:bg-gray-900 transition-colors duration-200">
          <span className="text-xl font-bold">Pitchfork</span>
        </button>
        <span className="mt-3 text-lg font-medium text-white group-hover:text-spotify-green transition-colors duration-200">
          Pitchfork 8.0+ Albums
        </span>
      </a>
    </div>
  );
}