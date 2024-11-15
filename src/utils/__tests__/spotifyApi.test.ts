import { fetchWithTokenRefresh, refreshAccessToken } from '../spotifyApi';
import SpotifyWebApi from 'spotify-web-api-node';

// Mock modules first
jest.mock('spotify-web-api-node');

// Mock global fetch
global.fetch = jest.fn();

// Constants for testing
const MOCK_TOKEN_RESPONSE = {
  body: {
    access_token: 'mock-new-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'Bearer',
    scope: 'playlist-modify-public playlist-modify-private'
  }
};

describe('Spotify API Utils', () => {
  const mockRefreshToken = MOCK_TOKEN_RESPONSE.body.refresh_token;
  const mockInitialAccessToken = 'mock-initial-access-token';
  const mockNewAccessToken = MOCK_TOKEN_RESPONSE.body.access_token;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup SpotifyWebApi mock implementation
    (SpotifyWebApi as jest.Mock).mockImplementation(() => ({
      setRefreshToken: jest.fn(),
      refreshAccessToken: jest.fn().mockResolvedValue(MOCK_TOKEN_RESPONSE)
    }));
  });

  it('should refresh token and retry request when receiving 401', async () => {
    // Mock fetch responses for the 401 scenario
    (global.fetch as jest.Mock)

    // Mock fetch responses
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => 
        Promise.resolve({
          status: 401,
          ok: false
        })
      )
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
    expect(spotifyApi.setRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
    expect(spotifyApi.refreshAccessToken).toHaveBeenCalled();

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

  it('should successfully refresh access token', async () => {
    const result = await refreshAccessToken(mockRefreshToken);
    
    expect(result).toEqual({
      accessToken: mockNewAccessToken,
      refreshToken: mockRefreshToken,
      expiresIn: 3600
    });
  });

  it('should not refresh token for non-401 errors', async () => {
    // Mock fetch to return success

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
    const mockSpotifyApi = new SpotifyWebApi();
    expect(mockSpotifyApi.refreshAccessToken).not.toHaveBeenCalled();

    // Verify response
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
  });
});