import { Album } from '../types/album';

let JSDOM: any;

export interface PitchforkAlbum {
  artist: string;
  album: string;
  publishDate: string;
}

let cache = new Map<string, Map<string, PitchforkAlbum[]>>();

export const parsePitchforkHtml = async (type: string, html: string): Promise<PitchforkAlbum[]> => {
  // Check if the result is already in the cache
  const typeCache = cache.get(type);
  if (typeCache && typeCache.has(html)) {
    return typeCache.get(html)!;
  }

  // Parse the HTML and store the result in the cache
  const albums = await parsePitchforkHtml(type, html);
  if (!cache.has(type)) {
    cache.set(type, new Map());
  }
  const typeCacheUpdated = cache.get(type)!;
  typeCacheUpdated.set(html, albums);
  cache.set(type, typeCacheUpdated);
  return albums;
  if (!JSDOM) {
    const jsdom = await import('jsdom');
    JSDOM = jsdom.JSDOM;
  }
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

    summaryItems.forEach((item, index) => {
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
        } else {
//           logger.warn(`Skipping incomplete album entry. Artist: ${artist || 'missing'}, Album: ${album || 'missing'}, Date: ${publishDate || 'missing'}`);
        }
      } catch (error) {
//         logger.error('Error parsing individual album item:', error instanceof Error ? error.message : String(error));
      }
    });
  } catch (error) {
//     logger.error('Error in JSDOM parsing:', error instanceof Error ? error.message : String(error));
    // Return empty array instead of failing completely
    return [];
  } finally {
    // Cleanup JSDOM resources
    if (typeof window === 'undefined') {
      // Only run on server-side
      try {
        dom?.window?.close();
      } catch (error) {
//         logger.error('Error closing JSDOM window:', error instanceof Error ? error.message : String(error));
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