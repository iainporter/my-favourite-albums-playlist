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
            <div>
              <h1 className="text-xl font-bold text-white">
                My Favorite Albums Playlist
              </h1>
              <p className="text-xs text-gray-400">
                Uses the Spotify® Web API
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
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
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