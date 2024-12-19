import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Information We Collect</h2>
              <p>When you use Spotify Playlist Manager, we collect:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Your Spotify authentication tokens for accessing the Spotify API</li>
                <li>Playlist data and music preferences you create within the application</li>
                <li>Basic usage data to improve our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Authenticate with Spotify's services</li>
                <li>Create and manage playlists on your behalf</li>
                <li>Improve our application's functionality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Data Storage</h2>
              <p>We store your Spotify tokens securely in your browser's local storage. We do not maintain a separate database of user information.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Third-Party Services</h2>
              <p>We use Spotify's API services. Your use of this application is also subject to Spotify's privacy policy and terms of service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">Contact</h2>
              <p>For any privacy-related questions, please contact us at [contact email].</p>
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