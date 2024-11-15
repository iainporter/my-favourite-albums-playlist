import { Album } from '../types/album';

export interface PitchforkAlbum {
  artist: string;
  album: string;
  publishDate: string;
}

export const parsePitchforkHtml = (html: string): PitchforkAlbum[] => {
  const albums: PitchforkAlbum[] = [];
  
  // Create a temporary DOM element to parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
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
      console.error('Error parsing album item:', error);
    }
  });
  
  return albums;
};

export const convertToAlbum = (pitchforkAlbum: PitchforkAlbum): Album => {
  const year = new Date(pitchforkAlbum.publishDate).getFullYear().toString();
  
  return {
    artist: pitchforkAlbum.artist,
    album: pitchforkAlbum.album,
    year,
    rating: '8.0+' // Since these are high-scoring albums
  };
};