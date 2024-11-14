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
    render(
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

    // Verify search request
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=artist:Test%20Artist%20album:Test%20Album'),
        expect.any(Object)
      );
    });

    // Verify search results are set
    await waitFor(() => {
      expect(mockSetAlbumSearchResults).toHaveBeenCalledWith(mockSearchResponse.albums.items);
    });

    // Verify pagination state
    expect(screen.getByText('Next')).toBeEnabled();
    expect(screen.getByText('Next')).toHaveClass('bg-spotify-green');
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByText(/showing 1-20 of 50 results/i)).toBeInTheDocument();

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

    render(
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

    // Click next page
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Verify second page results
    await waitFor(() => {
      expect(mockSetAlbumSearchResults).toHaveBeenCalledWith(mockSecondPage.albums.items);
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
});