import { Album } from '../types/album';
import { JSDOM } from 'jsdom';
import { HtmlParser } from './HtmlParser';

export interface DIYAlbum {
  artist: string;
  album: string;
  publishDate: string;
}

export class DIYParser implements HtmlParser {
  private parseDIYHtml = (html: string): DIYAlbum[] => {
  const albums: DIYAlbum[] = [];
  
  // Create a temporary DOM element to parse the HTML using jsdom
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  // Find all header elements
  const headers = doc.querySelectorAll('header');
  headers.forEach((header, index) => {
    try {
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
      }
    } catch (error) {
      console.error('Error parsing album item:', error);
    }
  });
  
  return albums;
};

  parseHtml(html: string): Album[] {
    const diyAlbums = this.parseDIYHtml(html);
    return diyAlbums.map(album => this.convertToAlbum(album));
  }
}

  private convertToAlbum = (diyAlbum: DIYAlbum): Album => {
  const year = new Date(diyAlbum.publishDate).getFullYear().toString();
  
  return {
    artist: diyAlbum.artist,
    album: diyAlbum.album,
    year: diyAlbum.publishDate,
    rating: 'DIY Featured'
  };
};