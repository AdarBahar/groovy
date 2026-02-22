import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import ProductionPage from './pages/ProductionPage';
import EmbedPage from './pages/EmbedPage';
import PocPage from './pages/PocPage';
import NewUIPage from './pages/NewUIPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { track } from './utils/analytics';
import './App.css';

/**
 * Home route component that conditionally renders EmbedPage or ProductionPage
 * based on the `embed=true` URL parameter.
 */
function HomePage() {
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';

  return isEmbed ? <EmbedPage /> : <ProductionPage />;
}

function App() {
  // Use Vite's BASE_URL for React Router basename
  // In development: '/' (root)
  // In production: '/scribe2/' (subdirectory)
  const basename = import.meta.env.BASE_URL;

  // Track when users visit via shared links
  useEffect(() => {
    // Check if URL has groove parameters (indicates shared link)
    const params = new URLSearchParams(window.location.search);
    const hasGrooveParams =
      params.has('TimeSig') ||
      params.has('Div') ||
      params.has('Tempo') ||
      params.has('H') ||
      params.has('S') ||
      params.has('K');

    if (hasGrooveParams) {
      // Determine referrer source
      let referrerSource = 'direct';
      const referrer = document.referrer || '';

      if (referrer.includes('twitter.com') || referrer.includes('x.com')) {
        referrerSource = 'twitter';
      } else if (referrer.includes('facebook.com')) {
        referrerSource = 'facebook';
      } else if (referrer.includes('reddit.com')) {
        referrerSource = 'reddit';
      } else if (referrer.includes('linkedin.com')) {
        referrerSource = 'linkedin';
      } else if (referrer.includes('whatsapp')) {
        referrerSource = 'whatsapp';
      } else if (referrer.includes('t.me') || referrer.includes('telegram')) {
        referrerSource = 'telegram';
      } else if (referrer.length > 0) {
        referrerSource = 'shared_link';
      }

      // Track the visit
      track('Share Link Clicked', {
        source: referrerSource,
        referrer: referrer || 'unknown',
        embed: params.get('embed') === 'true' ? 'embed' : 'editor',
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/poc" element={<PocPage />} />
          <Route path="/newUI" element={<NewUIPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

