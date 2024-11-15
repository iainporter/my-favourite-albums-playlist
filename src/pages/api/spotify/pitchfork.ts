import { NextApiRequest, NextApiResponse } from 'next';
import { parsePitchforkHtml, convertToAlbum } from '../../../utils/pitchforkParser';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://pitchfork.com/reviews/best/high-scoring-albums/');
    const html = await response.text();

    const pitchforkAlbums = parsePitchforkHtml(html);
    const albums = pitchforkAlbums.map(convertToAlbum);

    res.status(200).json(albums);
  } catch (error) {
    console.error('Error fetching Pitchfork data:', error);
    res.status(500).json({ message: 'Error fetching Pitchfork data' });
  }
}