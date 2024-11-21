import type { NextApiRequest, NextApiResponse } from 'next';
import { parseAcclaimedHtml } from '../../../utils/acclaimedParser';
import { handleApiError } from '../../../utils/errorHandler';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://www.acclaimedmusic.net/year/alltime_albums.htm');
    const html = await response.text();
    const albums = parseAcclaimedHtml(html);
    res.status(200).json(albums);
  } catch (error) {
    handleApiError(error);
  }
}