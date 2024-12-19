import React from 'react';
import Image from 'next/image';

interface SpotifyUsageGuidelinesProps {
  isOpen: boolean;
  onClose: () => void;
}

const SpotifyUsageGuidelines = ({ isOpen, onClose }: SpotifyUsageGuidelinesProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Image
              src="/spotify-logo.png"
              alt="Spotify Logo"
              width={32}
              height={32}
            />
            <h2 className="text-xl font-bold text-white">Content Usage Guidelines</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 text-gray-300">
          <div className="bg-gray-800/50 p-4 rounded-lg border-l-4 border-red-500">
            <h3 className="text-red-400 font-semibold mb-2">Prohibited Actions</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Downloading or "ripping" content from Spotify</li>
              <li>Copying or redistributing audio content</li>
              <li>Circumventing content protection measures</li>
              <li>Using content outside of Spotify's platform</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-lg border-l-4 border-spotify-green">
            <h3 className="text-spotify-green font-semibold mb-2">Permitted Usage</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Streaming through official Spotify applications</li>
              <li>Creating and sharing playlists</li>
              <li>Linking to Spotify content</li>
              <li>Using Spotify's official sharing features</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Legal Notice</h3>
            <p className="text-sm">
              All content is protected by copyright and owned by Spotify or its licensors. 
              Any unauthorized use may result in account termination and potential legal action.
            </p>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
            <a
              href="https://www.spotify.com/legal/end-user-agreement/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-spotify-green hover:text-green-400 transition-colors text-sm"
            >
              View Full Terms of Service →
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-spotify-green text-white rounded-full hover:bg-green-600 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyUsageGuidelines;