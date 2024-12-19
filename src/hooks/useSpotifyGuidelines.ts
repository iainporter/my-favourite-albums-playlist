import { useState, useEffect } from 'react';

export const useSpotifyGuidelines = () => {
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [hasSeenGuidelines, setHasSeenGuidelines] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('hasSeenSpotifyGuidelines');
    setHasSeenGuidelines(!!seen);
  }, []);

  const showGuidelinesOnce = () => {
    if (!hasSeenGuidelines) {
      setShowGuidelines(true);
    }
  };

  const acknowledgeGuidelines = () => {
    localStorage.setItem('hasSeenSpotifyGuidelines', 'true');
    setHasSeenGuidelines(true);
    setShowGuidelines(false);
  };

  const forceShowGuidelines = () => {
    setShowGuidelines(true);
  };

  return {
    showGuidelines,
    hasSeenGuidelines,
    showGuidelinesOnce,
    acknowledgeGuidelines,
    forceShowGuidelines,
  };
};