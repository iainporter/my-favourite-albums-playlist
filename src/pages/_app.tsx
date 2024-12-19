import Head from 'next/head'
import { AppProps } from 'next/app'
import '../styles/index.css'
import ErrorBoundary from '../components/ErrorBoundary'
import Footer from '../components/Footer'
import SpotifyDisclaimer from '../components/SpotifyDisclaimer'
import SpotifyCopyright from '../components/SpotifyCopyright'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Head>
        <title>My Favourite Albums Playlist</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content="Create and manage Spotify playlists from your favorite albums" />
        <meta name="application-name" content="Spotify Playlist Manager" />
        <meta name="keywords" content="spotify, playlist, music, albums" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <Component {...pageProps} />
        <div className="mt-auto">
          <Footer />
          <SpotifyDisclaimer />
          <SpotifyCopyright />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default MyApp