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
    
    // Create a mock instance
    const mockRefreshTokenFn = jest.fn().mockResolvedValue({
      body: {
        access_token: mockNewAccessToken,
        refresh_token: mockRefreshToken,
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'playlist-modify-public playlist-modify-private'
      }
    });

    const mockSetRefreshTokenFn = jest.fn();

    // Mock the SpotifyWebApi constructor
    (SpotifyWebApi as jest.Mock).mockImplementation(() => ({
      setRefreshToken: mockSetRefreshTokenFn,
      refreshAccessToken: mockRefreshTokenFn
    }));
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

    // Get the mock instance that was created
    const mockSpotifyInstance = (SpotifyWebApi as jest.Mock).mock.results[0].value;
    
    // Verify token refresh was attempted
    expect(mockSpotifyInstance.setRefreshToken)
      .toHaveBeenCalledWith(mockRefreshToken);
    expect(mockSpotifyInstance.refreshAccessToken)
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
    
    // Get the mock instance that was created
    const mockSpotifyInstance = (SpotifyWebApi as jest.Mock).mock.results[0].value;
    
    // Verify token refresh was not attempted
    expect(mockSpotifyInstance.refreshAccessToken)
      .not.toHaveBeenCalled();

    // Verify response
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
  });
});