import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Service workers require an HTTP(S) origin and cannot run from the desktop app's file URL.
if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
