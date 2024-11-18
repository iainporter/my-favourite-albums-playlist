import Head from 'next/head'
import { AppProps } from 'next/app'
import '../styles/index.css'
import ErrorBoundary from '../components/ErrorBoundary'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Head>
        <title>My Favourite Albums Playlist</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Component {...pageProps} />
    </ErrorBoundary>
  )
}

export default MyApp