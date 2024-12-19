import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <a 
              href="https://spotify.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2"
            >
              <Image
                src="/spotify-logo.png"
                alt="Spotify Logo"
                width={24}
                height={24}
              />
              <span>Powered by Spotify</span>
            </a>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <Link 
              href="/privacy-policy"
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/user-agreement"
              className="hover:text-white transition-colors"
            >
              User Agreement
            </Link>
            <span>© {new Date().getFullYear()} Spotify Playlist Manager</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;