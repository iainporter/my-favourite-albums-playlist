import React from 'react';
import Image from 'next/image';

interface SpotifyAttributionProps {
  contentType: 'album' | 'track' | 'playlist';
  contentId: string;
  contentName: string;
  artistName?: string;
  className?: string;
}

const SpotifyAttribution = ({ 
  contentType, 
  contentId, 
  contentName, 
  artistName, 
  className = '' 
}: SpotifyAttributionProps) => {
  const getSpotifyUrl = () => {
    const baseUrl = 'https://open.spotify.com';
    switch (contentType) {
      case 'album':
        return `${baseUrl}/album/${contentId}`;
      case 'track':
        return `${baseUrl}/track/${contentId}`;
      case 'playlist':
        return `${baseUrl}/playlist/${contentId}`;
      default:
        return baseUrl;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Image
        src="/spotify-logo.png"
        alt="Spotify"
        width={16}
        height={16}
        className="opacity-75"
      />
      <a
        href={getSpotifyUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gray-400 hover:text-spotify-green transition-colors group flex items-center"
      >
        <span>Listen on Spotify</span>
        <svg 
          className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z"/>
        </svg>
      </a>
      <span className="text-xs text-gray-500">
        {artistName ? `${artistName} · ` : ''}{contentName}
      </span>
    </div>
  );
};

export default SpotifyAttribution;