import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { logger } from './services/logger';
import App from './App.tsx';

logger.install();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
