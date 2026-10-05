import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles/index.css';
import App from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';

// Retired feature: the legal storage inventory no longer lists this key.
try {
  window.localStorage.removeItem('travseeker:saved-essentials');
} catch {
  // Storage can be unavailable in private modes; nothing to clean then.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
