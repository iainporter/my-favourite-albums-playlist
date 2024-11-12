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
    <div className="container mx-auto p-4">
      <main>
        <h1 className="text-3xl font-bold mb-8 text-center">
          Spotify Playlist Manager
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Authentication failed. Please try again.
          </div>
        )}

        {!accessToken ? (
          <div className="text-center">
            <button
              onClick={handleLogin}
              className="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition-colors"
            >
              Connect with Spotify
            </button>
          </div>
        ) : (
          <PlaylistManager accessToken={accessToken} />
        )}
      </main>
    </div>
  )
}
