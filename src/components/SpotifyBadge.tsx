import React from 'react';
import Image from 'next/image';

interface SpotifyBadgeProps {
  type: 'album' | 'track' | 'playlist';
  className?: string;
}

const SpotifyBadge = ({ type, className = '' }: SpotifyBadgeProps) => {
  return (
    <div className={`flex items-center space-x-1 text-xs text-gray-400 ${className}`}>
      <Image
        src="/spotify-logo.png"
        alt="Spotify"
        width={12}
        height={12}
        className="opacity-75"
      />
      <span>Play on Spotify {type}</span>
    </div>
  );
};

export default SpotifyBadge;