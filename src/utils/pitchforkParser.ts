import { Album } from '../types/album';
import { JSDOM } from 'jsdom';

export interface PitchforkAlbum {
  artist: string;
  album: string;
  publishDate: string;
}

export const parsePitchforkHtml = (html: string): PitchforkAlbum[] => {
  const albums: PitchforkAlbum[] = [];
  let dom: JSDOM | undefined;
  
  try {
    // Create a temporary DOM element to parse the HTML using jsdom with minimal features
    dom = new JSDOM(html, {
      runScripts: 'outside-only',
      resources: 'usable',
      pretendToBeVisual: false,
    });
    const doc = dom.window.document;
    
    // Find all summary items
    const summaryItems = doc.querySelectorAll('.summary-item');
    
    summaryItems.forEach((item) => {
      try {
        // Extract artist
        const artistElement = item.querySelector('.summary-item__sub-hed');
        const artist = artistElement ? artistElement.textContent?.trim() : '';
        
        // Extract album
        const albumElement = item.querySelector('[data-testid="SummaryItemHed"] em');
        const album = albumElement ? albumElement.textContent?.trim() : '';
        
        // Extract publish date
        const dateElement = item.querySelector('.summary-item__publish-date');
        const publishDate = dateElement ? dateElement.textContent?.trim() : '';
        
        if (artist && album && publishDate) {
          albums.push({
            artist,
            album,
            publishDate
          });
        }
      } catch (error) {
        console.error('Error parsing individual album item:', error);
      }
    });
  } catch (error) {
    console.error('Error in JSDOM parsing:', error);
    // Return empty array instead of failing completely
    return [];
  } finally {
    // Cleanup JSDOM resources
    if (typeof window === 'undefined') {
      // Only run on server-side
      try {
        dom?.window?.close();
      } catch (error) {
        console.error('Error closing JSDOM window:', error);
      }
    }
  }
  
  return albums;
};

export const convertToAlbum = (pitchforkAlbum: PitchforkAlbum): Album => {
  const year = new Date(pitchforkAlbum.publishDate).getFullYear().toString();
  
  return {
    artist: pitchforkAlbum.artist,
    album: pitchforkAlbum.album,
    year: pitchforkAlbum.publishDate,
    rating: '8.0+' // Since these are high-scoring albums
  };
};