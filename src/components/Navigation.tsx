import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

export default function Navigation() {
  const location = useLocation();
  const isPoc = location.pathname === '/poc';

  return (
    <nav className="navigation">
      <Link to={isPoc ? '/' : '/poc'} className="nav-link">
        {isPoc ? '← Back to Production' : '→ Go to POC Testing'}
      </Link>
    </nav>
  );
}

