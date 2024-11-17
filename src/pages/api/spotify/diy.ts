import type { NextApiRequest, NextApiResponse } from 'next';
import { parseDIYHtml } from '../../../utils/diyParser';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://diymag.com/reviews/album-reviews');
    if (!response.ok) {
      throw new Error('Failed to fetch DIY Magazine reviews');
    }
    
    const html = await response.text();
    const albums = parseDIYHtml(html);
    
    res.status(200).json(albums);
  } catch (error) {
    console.error('Error fetching DIY Magazine reviews:', error);
    res.status(500).json({ message: 'Failed to fetch DIY Magazine reviews' });
  }
}