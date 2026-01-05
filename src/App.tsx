import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProductionPage from './pages/ProductionPage';
import PocPage from './pages/PocPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProductionPage />} />
        <Route path="/poc" element={<PocPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

