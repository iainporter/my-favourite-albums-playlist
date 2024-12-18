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

  it('renders with initial props and handles search correctly', async () => {
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

    // Render the component with all required and optional props
    const { rerender } = render(
      <SearchForm
        accessToken={mockAccessToken}
        albumSearchResults={[]}
        setAlbumSearchResults={mockSetAlbumSearchResults}
        initialPage={1}
        initialArtist="Initial Artist"
        initialAlbum="Initial Album"
        initialTotalResults={0}
        initialNextUrl={null}
        initialPrevUrl={null}
        onSearchStateChange={mockOnSearchStateChange}
      />
    );

    // Verify initial state
    expect(screen.getByLabelText(/artist/i)).toHaveValue('Initial Artist');
    expect(screen.getByLabelText(/album/i)).toHaveValue('Initial Album');

    // Perform search
    const artistInput = screen.getByLabelText(/artist/i);
    const albumInput = screen.getByLabelText(/album/i);
    const searchButton = screen.getByText(/search spotify/i);

    fireEvent.change(artistInput, { target: { value: 'Test Artist' } });
    fireEvent.change(albumInput, { target: { value: 'Test Album' } });
    fireEvent.click(searchButton);

    // Wait for the search request
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search?q=artist%3ATest%20Artist%20album%3ATest%20Album&type=album&limit=20&offset=0',
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${mockAccessToken}`
          }
        })
      );
    });

    // Wait for search results to be set
    await waitFor(() => {
      expect(mockSetAlbumSearchResults).toHaveBeenCalledWith(mockSearchResponse.albums.items);
    });

    // Rerender with the search results
    rerender(
      <SearchForm
        accessToken={mockAccessToken}
        albumSearchResults={mockSearchResponse.albums.items}
        setAlbumSearchResults={mockSetAlbumSearchResults}
        initialPage={1}
        initialArtist="Test Artist"
        initialAlbum="Test Album"
        initialTotalResults={50}
        initialNextUrl="http://api.spotify.com/v1/search?page=2"
        initialPrevUrl={null}
        onSearchStateChange={mockOnSearchStateChange}
      />
    );

    // Now verify pagination elements
    await waitFor(() => {
      expect(screen.getByText(/page 1/i)).toBeInTheDocument();
      expect(screen.getByText(/showing 1-20 of 50 results/i)).toBeInTheDocument();
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeEnabled();
      expect(nextButton).toHaveClass('bg-spotify-green');
    });

    // Verify search state change was called with correct data
    expect(mockOnSearchStateChange).toHaveBeenCalledWith(expect.objectContaining({
      currentPage: 1,
      artist: 'Test Artist',
      album: 'Test Album',
      totalResults: 50,
      nextUrl: 'http://api.spotify.com/v1/search?page=2',
      previousUrl: null
    }));
  });

  it('handles pagination correctly', async () => {
    const mockFirstPage = {
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

    const mockSecondPage = {
      albums: {
        items: Array(20).fill(null).map((_, i) => ({
          id: `album-${i + 20}`,
          name: `Album ${i + 20}`,
          release_date: '2023-01-01',
          images: [{ url: 'test-image-url', height: 300, width: 300 }],
          uri: `spotify:album:${i + 20}`
        })),
        total: 50,
        next: null,
        previous: 'http://api.spotify.com/v1/search?page=1'
      }
    };

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockFirstPage)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSecondPage)
      }));

    const { rerender } = render(
      <SearchForm
        accessToken={mockAccessToken}
        albumSearchResults={[]}
        setAlbumSearchResults={mockSetAlbumSearchResults}
        onSearchStateChange={mockOnSearchStateChange}
      />
    );

    // Initial search
    const artistInput = screen.getByLabelText(/artist/i);
    const searchButton = screen.getByText(/search spotify/i);

    fireEvent.change(artistInput, { target: { value: 'Test Artist' } });
    fireEvent.click(searchButton);

    // Wait for first page results
    await waitFor(() => {
      expect(mockSetAlbumSearchResults).toHaveBeenCalledWith(mockFirstPage.albums.items);
    });

    // Rerender with first page results
    rerender(
      <SearchForm
        accessToken={mockAccessToken}
        albumSearchResults={mockFirstPage.albums.items}
        setAlbumSearchResults={mockSetAlbumSearchResults}
        onSearchStateChange={mockOnSearchStateChange}
        initialPage={1}
        initialTotalResults={50}
        initialNextUrl="http://api.spotify.com/v1/search?page=2"
        initialPrevUrl={null}
      />
    );

    // Click next page
    const nextButton = await screen.findByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Wait for second page results
    await waitFor(() => {
      expect(mockSetAlbumSearchResults).toHaveBeenCalledWith(mockSecondPage.albums.items);
    });

    // Verify search state was updated
    expect(mockOnSearchStateChange).toHaveBeenCalledWith(expect.objectContaining({
      currentPage: 2,
      artist: 'Test Artist',
      album: '',
      totalResults: 50,
      nextUrl: null,
      previousUrl: 'http://api.spotify.com/v1/search?page=1'
    }));
  });
});