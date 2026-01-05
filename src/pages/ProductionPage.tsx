import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import './ProductionPage.css';

export default function ProductionPage() {
  return (
    <div className="production-page">
      <Navigation />
      <header className="production-header">
        <h1>🎵 Groovy</h1>
        <p className="subtitle">Modern Drum Pattern Editor</p>
      </header>

      <main className="production-main">
        <div className="coming-soon">
          <h2>Production UI Coming Soon</h2>
          <p>The production interface is under development.</p>
          <p>
            In the meantime, you can test the core functionality in the{' '}
            <Link to="/poc" className="poc-link">POC Testing Page</Link>
          </p>
        </div>

        <div className="features">
          <h3>Planned Features</h3>
          <ul>
            <li>✨ Modern, intuitive drum grid interface</li>
            <li>🎨 Beautiful, responsive design</li>
            <li>🎵 Advanced pattern editing tools</li>
            <li>💾 Save and load patterns</li>
            <li>🔄 Pattern variations and fills</li>
            <li>🎹 MIDI export support</li>
            <li>🎧 Multiple drum kit sounds</li>
            <li>📱 Mobile-friendly interface</li>
          </ul>
        </div>
      </main>

      <footer className="production-footer">
        <Link to="/poc" className="test-link">
          → Go to POC Testing Page
        </Link>
      </footer>
    </div>
  );
}

