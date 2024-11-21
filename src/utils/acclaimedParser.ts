import { JSDOM } from 'jsdom';

export interface AcclaimedAlbum {
  artist: string;
  album: string;
  publishDate: string;
}

export const parseAcclaimedHtml = (html: string): AcclaimedAlbum[] => {
  const albums: AcclaimedAlbum[] = [];
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Find all album rows in the table
  const rows = doc.querySelectorAll('tr');
  
  rows.forEach((row) => {
    try {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        // Skip header row and ensure we have enough cells
        const albumCell = cells[2];
        if (!albumCell) return;

        const albumText = albumCell.textContent?.trim() || '';
        // The format is typically "Artist / Album (Year)"
        const match = albumText.match(/(.+)\s*\/\s*(.+)\s*\((\d{4})\)/);
        
        if (match) {
          const [_, artist, album, year] = match;
          albums.push({
            artist: artist.trim(),
            album: album.trim(),
            publishDate: year
          });
        }
      }
    } catch (error) {
      console.error('Error parsing album row:', error);
    }
  });
  
  return albums;
};