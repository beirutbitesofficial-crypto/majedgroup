import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './styles/app.css';
import App from './App.jsx';
import { MG } from './lib/index.js';

// handy for support & troubleshooting from the browser console
window.MG = MG;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
