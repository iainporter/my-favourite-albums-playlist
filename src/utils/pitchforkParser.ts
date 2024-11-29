import { Album } from '../types/album';
import { HtmlParser } from './HtmlParser';
import { setCachedData } from './cache';

let JSDOM: any;

export interface PitchforkAlbum {
  artist: string;
  album: string;
  publishDate: string;
}

export class PitchforkParser implements HtmlParser {

  async parseHtml(html: string): Promise<Album[]> {
    const pitchforkAlbums = await this.parsePitchforkHtml(html);
    return pitchforkAlbums.map(album => this.convertToAlbum(album));
  }

  private async parsePitchforkHtml = async (html: string): Promise<PitchforkAlbum[]> => {
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
  setCachedData('pitchfork-albums', albums);
  return albums;
};

  private convertToAlbum = (pitchforkAlbum: PitchforkAlbum): Album => {
  const year = new Date(pitchforkAlbum.publishDate).getFullYear().toString();
  
  return {
    artist: pitchforkAlbum.artist,
    album: pitchforkAlbum.album,
    year: pitchforkAlbum.publishDate,
    rating: '8' // Since these are high-scoring albums
  };
};
}