export interface Album {
  id?: string;
  artist: string;
  album: string;
  year: string;
  rating: string;
  reviewUrl?: string;
}

export interface ImportedAlbum extends Album {
  rowNumber: number;
}