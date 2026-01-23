import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import ProductionPage from './pages/ProductionPage';
import EmbedPage from './pages/EmbedPage';
import PocPage from './pages/PocPage';
import NewUIPage from './pages/NewUIPage';
import { ErrorBoundary } from './components/ErrorBoundary';
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

