import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProductionPage from './pages/ProductionPage';
import PocPage from './pages/PocPage';
import NewUIPage from './pages/NewUIPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function App() {
  // Use Vite's BASE_URL for React Router basename
  // In development: '/' (root)
  // In production: '/scribe2/' (subdirectory)
  const basename = import.meta.env.BASE_URL;

  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<ProductionPage />} />
          <Route path="/poc" element={<PocPage />} />
          <Route path="/newUI" element={<NewUIPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

