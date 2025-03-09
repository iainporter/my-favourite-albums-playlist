import React from 'react';

const SpotifyDisclaimer = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm text-white text-sm py-2 px-4 flex items-center justify-center space-x-4 z-50">
      <div className="flex items-center">
        <span>
          This is a third-party application that uses the Spotify® Web API but is not endorsed, certified, or otherwise approved by Spotify. 
          <a 
            href="https://www.spotify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-400 ml-1"
          >
            Spotify®
          </a>
          {' '}is a trademark of Spotify AB.
        </span>
      </div>
    </div>
  );
};

export default SpotifyDisclaimer;