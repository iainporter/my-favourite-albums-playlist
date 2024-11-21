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
      // Skip rows with class "tableheader_ya"
      if (row.classList.contains('tableheader_ya')) {
        return;
      }
      
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const artistCell = cells[1]?.querySelector('a');
        const albumCell = cells[2]?.querySelector('a');
        
        // Get the year from the last cell with class "notmobile"
        const yearCell = row.querySelector('td.notmobile:last-of-type a');
        const yearMatch = yearCell?.textContent?.match(/\d{4}/);
        const year = yearMatch ? yearMatch[0] : '';

        // Get the text content and trim it
        const artist = artistCell?.textContent?.trim() || '';
        const album = albumCell?.textContent?.trim() || '';

        // Only add the album if both artist and album are present and non-empty
        if (artist.length > 0 && album.length > 0) {
          albums.push({
            artist,
            album,
            year,  // Add the extracted year
            rating: '' // Empty rating as per requirement
          });
        }
      }
    } catch (error) {
      console.error('Error parsing album row:', error);
    }
  });
  
  return albums;
};