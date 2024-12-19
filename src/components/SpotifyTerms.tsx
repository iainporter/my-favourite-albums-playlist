import React from 'react';
import Image from 'next/image';

const SpotifyTerms = () => {
  return (
    <div className="bg-gray-900/90 backdrop-blur-sm text-white p-6 rounded-lg border border-gray-700">
      <div className="flex items-center space-x-3 mb-4">
        <Image
          src="/spotify-logo.png"
          alt="Spotify Logo"
          width={32}
          height={32}
        />
        <h2 className="text-xl font-bold">Spotify Content Guidelines</h2>
      </div>

      <div className="space-y-4 text-gray-300">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h3 className="text-spotify-green font-semibold mb-2">Content Usage</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>All content is provided through official Spotify services</li>
            <li>Streaming is only available through authorized Spotify applications</li>
            <li>Content downloading or "stream ripping" is strictly prohibited</li>
          </ul>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h3 className="text-spotify-green font-semibold mb-2">Attribution</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>All content remains the property of Spotify and rights holders</li>
            <li>Spotify branding and logos are used with permission</li>
            <li>Direct links to Spotify are provided for all content</li>
          </ul>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h3 className="text-spotify-green font-semibold mb-2">User Agreement</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Users must comply with Spotify's terms of service</li>
            <li>Content must be accessed through official channels only</li>
            <li>Unauthorized copying or distribution is prohibited</li>
          </ul>
        </div>

        <p className="text-sm text-gray-400 mt-4">
          By using this application, you agree to comply with Spotify's terms of service and content usage guidelines. 
          This is a third-party application using Spotify's services. Spotify® is a trademark of Spotify AB.
        </p>

        <div className="flex justify-end mt-4">
          <a
            href="https://www.spotify.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-spotify-green hover:text-green-400 transition-colors"
          >
            View Spotify's Full Terms of Service →
          </a>
        </div>
      </div>
    </div>
  );
};

export default SpotifyTerms;