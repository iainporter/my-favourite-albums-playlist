import { NextApiRequest, NextApiResponse } from 'next';

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

    // Here we would normally parse the HTML and extract the data
    // For demonstration, returning mock data as web scraping requires additional setup
    const mockData = [
      {
        artist: "Sample Artist 1",
        album: "Amazing Album",
        releaseDate: "2023-07-20",
        rating: "8.5"
      },
      {
        artist: "Sample Artist 2",
        album: "Fantastic Record",
        releaseDate: "2023-07-19",
        rating: "8.2"
      }
    ];

    res.status(200).json(mockData);
  } catch (error) {
    console.error('Error fetching Pitchfork data:', error);
    res.status(500).json({ message: 'Error fetching Pitchfork data' });
  }
}