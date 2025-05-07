import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/hooks/useAuth';
import type { AppProps } from 'next/app';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>Travel Planner AI</title>
        <meta name="description" content="Your personal AI-powered travel planning assistant. Get itineraries, recommendations, and answers to your travel questions." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Travel Planner AI" />
        <meta property="og:description" content="Your personal AI-powered travel planning assistant." />

        {/* Twitter (optional, but good practice) */}
        {/* <meta property="twitter:card" content="summary_large_image" /> */}
        {/* <meta property="twitter:title" content="Travel Planner AI" /> */}
        {/* <meta property="twitter:description" content="Your personal AI-powered travel planning assistant." /> */}
        {/* <meta property="twitter:image" content="URL_TO_YOUR_PREVIEW_IMAGE" /> */}
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;