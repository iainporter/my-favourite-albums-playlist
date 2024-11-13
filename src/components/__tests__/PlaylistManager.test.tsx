import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlaylistManager from '../PlaylistManager';

// Mock fetch globally
global.fetch = jest.fn();

describe('PlaylistManager', () => {
  const mockAccessToken = 'mock-token';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      })
    );

    render(<PlaylistManager accessToken={mockAccessToken} />);
    
    // Check for loading spinner
    expect(screen.getByRole('heading', { name: /my playlists/i })).toBeInTheDocument();
    expect(screen.getByText('Create Playlist')).toBeInTheDocument();
  });

  it('shows no playlists message when there are no playlists', async () => {
    // Mock the fetch response with empty playlists
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      })
    );

    render(<PlaylistManager accessToken={mockAccessToken} />);

    // Wait for the no playlists message to appear
    await waitFor(() => {
      expect(screen.getByText('No playlists available')).toBeInTheDocument();
    });
  });

  it('opens create playlist modal when create button is clicked', async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      })
    );

    render(<PlaylistManager accessToken={mockAccessToken} />);

    // Click create playlist button
    fireEvent.click(screen.getByText('Create Playlist'));

    // Check if modal is shown
    await waitFor(() => {
      expect(screen.getByText('Create New Playlist')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter playlist name')).toBeInTheDocument();
    });
  });
});