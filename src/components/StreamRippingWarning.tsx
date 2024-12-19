import React, { useState, useEffect } from 'react';

const StreamRippingWarning = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const hasSeenWarning = localStorage.getItem('hasSeenStreamRippingWarning');
    if (!hasSeenWarning) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('hasSeenStreamRippingWarning', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-lg w-full p-6 border border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h2 className="text-xl font-bold text-white">Important Notice</h2>
        </div>
        
        <div className="space-y-4 text-gray-300">
          <p>
            This application does not support and strictly prohibits:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Downloading or "ripping" of any Spotify content</li>
            <li>Unauthorized copying or distribution of music</li>
            <li>Circumvention of Spotify's content protection</li>
          </ul>
          <p>
            All music content is provided through Spotify's official services and must be accessed only through authorized Spotify applications.
          </p>
          <p className="text-sm text-gray-400">
            Attempting to download or copy protected content may violate Spotify's terms of service and applicable copyright laws.
          </p>
        </div>

        <button
          onClick={handleAccept}
          className="mt-6 w-full px-4 py-2 bg-spotify-green text-white rounded-full hover:bg-green-600 transition-colors duration-200"
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

export default StreamRippingWarning;