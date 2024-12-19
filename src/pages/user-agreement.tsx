import React from 'react';
import Link from 'next/link';

export default function UserAgreement() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">User Agreement</h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Terms of Use</h2>
              <p>By using Spotify Playlist Manager, you agree to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Use the service in compliance with Spotify's terms of service</li>
                <li>Not attempt to download or "rip" any content from Spotify</li>
                <li>Not use the service for any illegal or unauthorized purpose</li>
                <li>Respect intellectual property rights of content owners</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Spotify Integration</h2>
              <p>This application:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Uses Spotify's API to access and manage your playlists</li>
                <li>Requires you to authenticate with your Spotify account</li>
                <li>Will only perform actions you explicitly authorize</li>
                <li>Does not store your Spotify password</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Content Usage</h2>
              <p>All music content is provided through Spotify. You agree to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Use content only through official Spotify playback methods</li>
                <li>Not attempt to download or copy protected content</li>
                <li>Respect all copyright and intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Disclaimer</h2>
              <p>This application is not affiliated with Spotify AB. Spotify is a trademark of Spotify AB.</p>
            </section>
          </div>

          <div className="mt-8">
            <Link 
              href="/"
              className="text-spotify-green hover:text-green-400 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}