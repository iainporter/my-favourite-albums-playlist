import React from 'react';

const SpotifyCopyright = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-400">
              Content accessed via Spotify® Web API. Spotify® is a trademark of Spotify AB.
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-red-400">
              Downloading or copying content is strictly prohibited
            </span>
            <a
              href="https://www.spotify.com/legal/end-user-agreement/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:text-green-400 transition-colors"
            >
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyCopyright;