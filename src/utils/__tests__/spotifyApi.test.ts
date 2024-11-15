import { fetchWithTokenRefresh, refreshAccessToken, getSpotifyApi } from '../spotifyApi';
import SpotifyWebApi from 'spotify-web-api-node';

// Mock SpotifyWebApi and getSpotifyApi
jest.mock('spotify-web-api-node');
jest.mock('../spotifyApi', () => ({
  ...jest.requireActual('../spotifyApi'),
  getSpotifyApi: jest.fn()
}));

// Mock global fetch
global.fetch = jest.fn();

describe('Spotify API Utils', () => {
  const mockRefreshToken = 'mock-refresh-token';
  const mockInitialAccessToken = 'mock-initial-access-token';
  const mockNewAccessToken = 'mock-new-access-token';

  let mockSpotifyInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create the mock instance first
    mockSpotifyInstance = {
      setRefreshToken: jest.fn(),
      refreshAccessToken: jest.fn().mockResolvedValue({
        body: {
          access_token: mockNewAccessToken,
          refresh_token: mockRefreshToken,
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'playlist-modify-public playlist-modify-private'
        }
      })
    };

    // Mock getSpotifyApi to return our mock instance
    (getSpotifyApi as jest.Mock).mockReturnValue(mockSpotifyInstance);
  });

  it('should refresh token and retry request when receiving 401', async () => {
    // Mock first request to return 401
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => 
        Promise.resolve({
          status: 401,
          ok: false
        })
      )
      // Mock second request (after token refresh) to return success
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ data: 'success' })
        })
      );

    const initialOptions = {
      headers: {
        'Authorization': `Bearer ${mockInitialAccessToken}`,
        'Content-Type': 'application/json'
      }
    };

    // Call the function under test
    const response = await fetchWithTokenRefresh(
      'https://api.spotify.com/v1/test',
      initialOptions,
      mockRefreshToken
    );

    // Verify the refresh token flow
    expect(mockSpotifyInstance.setRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
    expect(mockSpotifyInstance.refreshAccessToken).toHaveBeenCalled();

    // Verify both fetch calls were made
    expect(fetch).toHaveBeenCalledTimes(2);
    
    // Verify first call (which fails with 401)
    expect(fetch).toHaveBeenNthCalledWith(1, 
      'https://api.spotify.com/v1/test',
      initialOptions
    );

    // Verify second call (with new token)
    expect(fetch).toHaveBeenNthCalledWith(2,
      'https://api.spotify.com/v1/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockNewAccessToken}`,
          'Content-Type': 'application/json'
        })
      })
    );

    // Verify final response
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
  });

  it('should not refresh token for non-401 errors', async () => {
    // Get the mock instance that was set up in beforeEach
    const mockSpotifyInstance = getSpotifyApi();

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        ok: true
      })
    );

    const initialOptions = {
      headers: {
        'Authorization': `Bearer ${mockInitialAccessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await fetchWithTokenRefresh(
      'https://api.spotify.com/v1/test',
      initialOptions,
      mockRefreshToken
    );

    // Verify only one request was made
    expect(fetch).toHaveBeenCalledTimes(1);
    
    // Verify token refresh was not attempted
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();

    // Verify response
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
  });
});