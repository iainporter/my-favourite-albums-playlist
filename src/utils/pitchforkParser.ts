import { Album } from '../types/album';
import { HtmlParser } from './HtmlParser';

let JSDOM: any;

export interface PitchforkAlbum {
  artist: string;
  album: string;
  publishDate: string;
  reviewUrl: string;
}

export class PitchforkParser implements HtmlParser {

  async parseHtml(html: string): Promise<Album[]> {
    const pitchforkAlbums = await this.parsePitchforkHtml(html);
    return pitchforkAlbums.map(album => this.convertToAlbum(album));
  }

  private parsePitchforkHtml = async (html: string): Promise<PitchforkAlbum[]> => {
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

    // First try to find schema.org JSON data
    const scriptElements = doc.querySelectorAll('script[type="application/ld+json"]');
    scriptElements.forEach(script => {
      try {
        const jsonData = JSON.parse(script.textContent || '');
        if (jsonData['@type'] === 'ListItem' && jsonData.url) {
          const artist = ''; // We'll still need to get this from the HTML
          const album = jsonData.name?.replace(/\*/g, '').trim() || '';
          if (album) {
            albums.push({
              artist,
              album,
              publishDate: new Date().toISOString(),
              reviewUrl: jsonData.url
            });
          }
        }
      } catch (error) {
        console.error('Error parsing JSON-LD:', error);
      }
    });

    // If no albums found from JSON-LD, fall back to HTML parsing
    if (albums.length === 0) {
      // Find all summary items - try different possible selectors
      const summaryItems = doc.querySelectorAll('.summary-item, article, [data-type="review"]');

      summaryItems.forEach((item, index) => {
        try {
          // Extract artist - try multiple possible selectors
          const artistElement = 
            item.querySelector('.summary-item__sub-hed') || 
            item.querySelector('[data-testid="ReviewHeader__artist"]') ||
            item.querySelector('.artist-name');
          const artist = artistElement ? artistElement.textContent?.trim() : '';
          
          // Extract album - try multiple possible selectors and formats
          let album = '';
          const albumElement = 
            item.querySelector('[data-testid="SummaryItemHed"] em') ||
            item.querySelector('[data-testid="ReviewHeader__title"]') ||
            item.querySelector('.review-title');
          
          if (albumElement) {
            album = albumElement.textContent?.trim() || '';
          } else {
            // Try to find album title in the heading text
            const headingElement = item.querySelector('h2, h3, .heading');
            if (headingElement) {
              const headingText = headingElement.textContent?.trim() || '';
              // Look for text between quotes or after a dash
              const matches = headingText.match(/"([^"]+)"/) || headingText.match(/[–-]\s*(.+)$/);
              if (matches && matches[1]) {
                album = matches[1].trim();
              }
            }
          }
          
          // Extract publish date - try multiple possible selectors
          const dateElement = 
            item.querySelector('.summary-item__publish-date') ||
            item.querySelector('time') ||
            item.querySelector('.pub-date');
          const publishDate = dateElement ? 
            (dateElement.getAttribute('datetime') || dateElement.textContent?.trim()) : 
            '';
          
          // Extract review URL from link
          let reviewUrl = '';
          const linkElement = 
            item.querySelector('[data-testid="SummaryItemHed"]') ||
            item.querySelector('a[href*="/reviews/"]') ||
            item.querySelector('a');
          
          if (linkElement) {
            const href = linkElement.getAttribute('href');
            if (href) {
              reviewUrl = href.startsWith('http') ? href : `https://pitchfork.com${href}`;
            }
          }
          
          if (artist && album) {
            albums.push({
              artist,
              album,
              publishDate: publishDate || new Date().toISOString(),
              reviewUrl
            });
          }
        } catch (error) {
          console.error('Error parsing individual album item:', error instanceof Error ? error.message : String(error));
        }
      });
  } catch (error) {
    console.error('Error in JSDOM parsing:', error instanceof Error ? error.message : String(error));
    return [];
  } finally {
    if (typeof window === 'undefined') {
      try {
        dom?.window?.close();
      } catch (error) {
        console.error('Error closing JSDOM window:', error instanceof Error ? error.message : String(error));
      }
    }
  }

  // For albums found in JSON-LD, we still need to find their artists from the HTML
  if (albums.length > 0) {
    const summaryItems = doc.querySelectorAll('.summary-item, article, [data-type="review"]');
    summaryItems.forEach((item) => {
      const artistElement = 
        item.querySelector('.summary-item__sub-hed') || 
        item.querySelector('[data-testid="ReviewHeader__artist"]') ||
        item.querySelector('.artist-name');
      if (artistElement) {
        const artist = artistElement.textContent?.trim() || '';
        // Find the first album without an artist and assign it
        const albumWithoutArtist = albums.find(a => !a.artist);
        if (albumWithoutArtist) {
          albumWithoutArtist.artist = artist;
        }
      }
    });
  }

  return albums;
};

  private convertToAlbum = (pitchforkAlbum: PitchforkAlbum): Album => {
    let year = new Date().getFullYear().toString();
    try {
      if (pitchforkAlbum.publishDate) {
        const date = new Date(pitchforkAlbum.publishDate);
        if (!isNaN(date.getTime())) {
          year = date.getFullYear().toString();
        }
      }
    } catch (error) {
      console.error('Error parsing date:', error);
    }
    
    return {
      artist: pitchforkAlbum.artist || 'Unknown Artist',
      album: pitchforkAlbum.album || 'Unknown Album',
      year: year,
      rating: '8', // Since these are high-scoring albums
      reviewUrl: pitchforkAlbum.reviewUrl || ''
    };
  };
}