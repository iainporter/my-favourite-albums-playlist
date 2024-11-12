import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PlaylistManager from '../components/PlaylistManager';

export default function Home() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const { access_token, error } = router.query;
    if (access_token) {
      setAccessToken(access_token as string);
    }
    if (error) {
      setError(error as string);
    }
  }, [router.query]);

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Spotify Playlist Manager
          </h1>
          <p className="text-gray-400 text-center mb-12 text-lg">
            Manage your Spotify playlists with ease
          </p>
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-8 max-w-md mx-auto">
              <p className="text-center">Authentication failed. Please try again.</p>
            </div>
          )}

          {!accessToken ? (
            <div className="text-center">
              <button
                onClick={handleLogin}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 to-green-400 rounded-full hover:from-green-400 hover:to-green-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <span className="mr-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </span>
                Connect with Spotify
                <span className="absolute right-0 -mt-12 h-32 w-8 opacity-40 bg-white transform rotate-12 transition-all duration-1000 ease-out group-hover:translate-x-[12rem]"></span>
              </button>
            </div>
          ) : (
            <PlaylistManager accessToken={accessToken} />
          )}
        </div>
      </main>
    </div>
  )
}
