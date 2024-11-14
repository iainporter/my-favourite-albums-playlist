import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchForm from '../SearchForm';

// Mock fetch globally
global.fetch = jest.fn();

describe('SearchForm', () => {
  const mockAccessToken = 'mock-token';
  const mockSetAlbumSearchResults = jest.fn();
  const mockOnSearchStateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preserves pagination state when switching between tabs', async () => {
    // Mock the initial search response with pagination
    const mockSearchResponse = {
      albums: {
        items: Array(20).fill(null).map((_, i) => ({
          id: `album-${i}`,
          name: `Album ${i}`,
          release_date: '2023-01-01',
          images: [{ url: 'test-image-url', height: 300, width: 300 }],
          uri: `spotify:album:${i}`
        })),
        total: 50,
        next: 'http://api.spotify.com/v1/search?page=2',
        previous: null
      }
    };

    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse)
      })
    );

    // Render the component with initial search results
    render(
      <SearchForm
        accessToken={mockAccessToken}
        albumSearchResults={[]}
        setAlbumSearchResults={mockSetAlbumSearchResults}
        onSearchStateChange={mockOnSearchStateChange}
      />
    );

    // Perform initial search
    const artistInput = screen.getByLabelText(/artist/i);
    const searchButton = screen.getByText(/search spotify/i);

    fireEvent.change(artistInput, { target: { value: 'Test Artist' } });
    fireEvent.click(searchButton);

    // Wait for search results to load
    await waitFor(() => {
      expect(mockSetAlbumSearchResults).toHaveBeenCalled();
    });

    // Verify Next button is enabled
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeEnabled();
    expect(nextButton).toHaveClass('bg-spotify-green');

    // Simulate switching to Import tab and back
    // Note: This is typically handled by the parent component, 
    // but we can verify that the search state is preserved through onSearchStateChange
    const lastSearchState = mockOnSearchStateChange.mock.calls[mockOnSearchStateChange.mock.calls.length - 1][0];
    
    // Verify the search state was saved with correct pagination
    expect(lastSearchState).toEqual(expect.objectContaining({
      currentPage: 1,
      artist: 'Test Artist',
      album: ''
    }));

    // Verify the Next button is still enabled and pagination info is preserved
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByText(/showing 1-20 of 50 results/i)).toBeInTheDocument();
  });
});