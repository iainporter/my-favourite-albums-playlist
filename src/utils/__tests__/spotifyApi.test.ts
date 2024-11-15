import { fetchWithTokenRefresh, refreshAccessToken } from '../spotifyApi';
import SpotifyWebApi from 'spotify-web-api-node';

// Mock SpotifyWebApi
jest.mock('spotify-web-api-node');

// Mock global fetch
global.fetch = jest.fn();

describe('Spotify API Utils', () => {
  const mockRefreshToken = 'mock-refresh-token';
  const mockInitialAccessToken = 'mock-initial-access-token';
  const mockNewAccessToken = 'mock-new-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock instance with the correct response structure
    const mockSpotifyApi = {
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

    // Mock the constructor to return our mock instance
    (SpotifyWebApi as jest.Mock).mockImplementation(() => mockSpotifyApi);
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

    const response = await fetchWithTokenRefresh(
      'https://api.spotify.com/v1/test',
      initialOptions,
      mockRefreshToken
    );

    // Verify the initial failed request
    expect(fetch).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/test',
      initialOptions
    );

    // Verify token refresh was attempted
    expect(SpotifyWebApi.prototype.setRefreshToken)
      .toHaveBeenCalledWith(mockRefreshToken);
    expect(SpotifyWebApi.prototype.refreshAccessToken)
      .toHaveBeenCalled();

    // Verify the retry request with new token
    expect(fetch).toHaveBeenCalledWith(
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
    expect(SpotifyWebApi.prototype.refreshAccessToken)
      .not.toHaveBeenCalled();

    // Verify response
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
  });
});