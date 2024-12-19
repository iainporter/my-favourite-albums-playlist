import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const Header = ({ isAuthenticated, onLogin, onLogout }: HeaderProps) => {
  return (
    <header className="bg-black/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/spotify-logo.png"
              alt="Spotify Logo"
              width={32}
              height={32}
            />
            <div>
              <h1 className="text-xl font-bold text-white">
                Playlist Manager
              </h1>
              <p className="text-xs text-gray-400">
                Powered by Spotify
              </p>
            </div>
          </div>

          <nav className="flex items-center space-x-6">
            <Link 
              href="/privacy-policy"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/user-agreement"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              User Agreement
            </Link>
            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="px-4 py-2 text-sm bg-spotify-green text-white rounded-full hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z"/>
                </svg>
                <span>Connect with Spotify</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;