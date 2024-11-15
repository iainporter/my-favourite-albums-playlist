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

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the refreshAccessToken function to always return a valid token response
    const mockRefreshAccessToken = jest.fn().mockResolvedValue({
      body: {
        access_token: mockNewAccessToken,
        refresh_token: mockRefreshToken,
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'playlist-modify-public playlist-modify-private'
      }
    });

    // Create the mock SpotifyWebApi instance
    const mockSpotifyApi = {
      setRefreshToken: jest.fn(),
      refreshAccessToken: mockRefreshAccessToken
    };

    // Mock the SpotifyWebApi constructor to return our mock instance
    (SpotifyWebApi as jest.Mock).mockImplementation(() => mockSpotifyApi);
    
    // Mock getSpotifyApi to return the same mock instance
    (getSpotifyApi as jest.Mock).mockReturnValue(mockSpotifyApi);
  });

  it('should refresh token and retry request when receiving 401', async () => {
    const spotifyApi = getSpotifyApi();

    // First verify that the mock refreshAccessToken returns a valid token
    spotifyApi.setRefreshToken(mockRefreshToken);
    const refreshResponse = await spotifyApi.refreshAccessToken();
    expect(refreshResponse.body.access_token).toBe(mockNewAccessToken);

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