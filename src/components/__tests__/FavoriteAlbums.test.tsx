import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FavoriteAlbums from '../FavoriteAlbums';

describe('FavoriteAlbums', () => {
  const mockAccessToken = 'mock-token';

  it('renders empty state correctly', () => {
    render(<FavoriteAlbums accessToken={mockAccessToken} />);
    
    expect(screen.getByText('No albums added yet')).toBeInTheDocument();
    expect(screen.getByText('Import your favorite albums to get started')).toBeInTheDocument();
  });

  it('renders import and sample buttons', () => {
    render(<FavoriteAlbums accessToken={mockAccessToken} />);
    
    expect(screen.getByText('Import Albums')).toBeInTheDocument();
    expect(screen.getByText('Download Sample')).toBeInTheDocument();
  });

  it('allows downloading sample data', () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockCreateObjectURL = jest.fn();
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    render(<FavoriteAlbums accessToken={mockAccessToken} />);
    
    const downloadButton = screen.getByText('Download Sample');
    fireEvent.click(downloadButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });
});