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
        <div className="w-48 h-48 rounded-lg overflow-hidden shadow-lg">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/47/Pitchfork_logo.svg"
            alt="Pitchfork Logo"
            className="w-full h-full object-cover bg-white p-4"
          />
        </div>
        <span className="mt-3 text-lg font-medium text-white group-hover:text-spotify-green transition-colors duration-200">
          Pitchfork 8.0+ Albums
        </span>
      </a>
    </div>
  );
}