import React from 'react';
import Image from 'next/image';

const SpotifyDisclaimer = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm text-white text-sm py-2 px-4 flex items-center justify-center space-x-4 z-50">
      <div className="flex items-center">
        <Image
          src="/spotify-logo.png"
          alt="Spotify Logo"
          width={20}
          height={20}
          className="mr-2"
        />
        <span>
          This is a third-party application using Spotify's services. 
          <a 
            href="https://www.spotify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-spotify-green hover:text-green-400 ml-1"
          >
            Spotify
          </a>
          {' '}and all related content are trademarks of Spotify AB.
        </span>
      </div>
    </div>
  );
};

export default SpotifyDisclaimer;