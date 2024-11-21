import { JSDOM } from 'jsdom';
import { Album } from '../types/album';

export const parseAcclaimedHtml = (html: string): Album[] => {
  const albums: Album[] = [];
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Find all album rows in the table
  const rows = doc.querySelectorAll('tr');
  
  rows.forEach((row) => {
    try {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const artistCell = cells[1]?.querySelector('a');
        const albumCell = cells[2]?.querySelector('a');

        if (artistCell && albumCell) {
          const artist = artistCell.textContent?.trim() || '';
          const album = albumCell.textContent?.trim() || '';

          if (artist && album) {
            albums.push({
              artist,
              album,
              year: '',  // Empty year as per requirement
              rating: '' // Empty rating as per requirement
            });
          }
        }
      }
    } catch (error) {
      console.error('Error parsing album row:', error);
    }
  });
  
  return albums;
};