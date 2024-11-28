import { Album } from '../types/album';
import { JSDOM } from 'jsdom';
import { logger } from './logger';

export interface DIYAlbum {
  artist: string;
  album: string;
  publishDate: string;
}

export const parseDIYHtml = (html: string): DIYAlbum[] => {
  const albums: DIYAlbum[] = [];
  
  // Create a temporary DOM element to parse the HTML using jsdom
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  logger.debug('Starting DIY HTML parsing');
  // Find all header elements
  const headers = doc.querySelectorAll('header');
  logger.debug(`Found ${headers.length} summary items to process`);
  headers.forEach((header, index) => {
    try {
      logger.debug(`Processing album ${index + 1} of ${headers.length}`);
      // Extract artist and album from the h3 element
      const titleElement = header.querySelector('.h-headline p strong');
      const titleText = header.querySelector('.h-headline p')?.textContent;

      if (titleElement && titleText) {
        const artist = titleElement.textContent?.trim() || '';
        // Extract album name by removing the artist and the em dash
        const album = titleText.replace(artist, '').replace('—', '').trim();
        
        // Extract publish date
        const dateElement = header.querySelector('.h-date');
        const publishDate = dateElement ? dateElement.textContent?.trim() : '';
        
        if (artist && album && publishDate) {
          albums.push({
            artist,
            album,
            publishDate
          });
        }
        logger.debug(`Successfully parsed album: "${album}" by ${artist}, published ${publishDate}`);
      }
    } catch (error) {
      console.error('Error parsing album item:', error);
    }
  });
  
  return albums;
};

export const convertToAlbum = (diyAlbum: DIYAlbum): Album => {
  const year = new Date(diyAlbum.publishDate).getFullYear().toString();
  
  return {
    artist: diyAlbum.artist,
    album: diyAlbum.album,
    year: diyAlbum.publishDate,
    rating: 'DIY Featured'
  };
};