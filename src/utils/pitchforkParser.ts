import { Album } from '../types/album';
import { logger } from './logger';

let JSDOM: any;

export interface PitchforkAlbum {
  artist: string;
  album: string;
  publishDate: string;
}

export const parsePitchforkHtml = async (html: string): Promise<PitchforkAlbum[]> => {
  if (!JSDOM) {
    const jsdom = await import('jsdom');
    JSDOM = jsdom.JSDOM;
  }
  logger.info('Starting Pitchfork HTML parsing');
  const albums: PitchforkAlbum[] = [];
  let dom: typeof JSDOM | undefined;
  
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
    logger.info(`Found ${summaryItems.length} summary items to process`);
    
    summaryItems.forEach((item, index) => {
      logger.info(`Processing album ${index + 1} of ${summaryItems.length}`);
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
          logger.info(`Successfully parsed album: "${album}" by ${artist}, published ${publishDate}`);
          albums.push({
            artist,
            album,
            publishDate
          });
        } else {
          logger.warn(`Skipping incomplete album entry. Artist: ${artist || 'missing'}, Album: ${album || 'missing'}, Date: ${publishDate || 'missing'}`);
        }
      } catch (error) {
        logger.error('Error parsing individual album item:', error instanceof Error ? error.message : String(error));
      }
    });
  } catch (error) {
    logger.error('Error in JSDOM parsing:', error instanceof Error ? error.message : String(error));
    // Return empty array instead of failing completely
    return [];
  } finally {
    // Cleanup JSDOM resources
    if (typeof window === 'undefined') {
      // Only run on server-side
      try {
        dom?.window?.close();
      } catch (error) {
        logger.error('Error closing JSDOM window:', error instanceof Error ? error.message : String(error));
      }
    }
  }
  
  logger.info(`Completed parsing Pitchfork HTML. Found ${albums.length} albums.`);
  return albums;
};

export const convertToAlbum = (pitchforkAlbum: PitchforkAlbum): Album => {
  logger.info(`Converting Pitchfork album to standard format: ${pitchforkAlbum.album} by ${pitchforkAlbum.artist}`);
  const year = new Date(pitchforkAlbum.publishDate).getFullYear().toString();
  
  return {
    artist: pitchforkAlbum.artist,
    album: pitchforkAlbum.album,
    year: pitchforkAlbum.publishDate,
    rating: '8.0+' // Since these are high-scoring albums
  };
};