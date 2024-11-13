# My Favourite Albums Playlist

A web application that allows users to create and manage Spotify playlists based on their favorite albums. Built with Next.js, TypeScript, and Tailwind CSS, this application integrates with the Spotify API to search for albums and create personalized playlists.

## Features

- Spotify Authentication
- Album search functionality
- Create playlists from favorite albums
- Add/remove tracks from playlists
- Responsive design with Tailwind CSS

## Prerequisites

Before you begin, ensure you have:

- Node.js (v18 or higher)
- npm or yarn package manager
- A Spotify Developer account and application credentials

## Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd my-favourite-albums-playlist
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Fill in your Spotify credentials in `.env`:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
   ```

   To get Spotify credentials:
   1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   2. Create a new application
   3. Copy the Client ID and Client Secret
   4. Add `http://localhost:3000/api/auth/callback` as a Redirect URI in your Spotify app settings

## Running the Application

1. Start the development server:
```bash
npm run dev
# or
yarn dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. For production builds:
```bash
npm run build
npm start
# or
yarn build
yarn start
```

## How to Use

1. Click the "Login with Spotify" button to authenticate
2. Search for albums using the search bar
3. Click the "+" button to add albums to your favorites
4. Use the playlist manager to create a new playlist or add tracks to an existing one
5. Manage your playlists directly from the interface

## Testing

Run the test suite:
```bash
npm test
# or
yarn test
```

For watch mode:
```bash
npm run test:watch
# or
yarn test:watch
```
