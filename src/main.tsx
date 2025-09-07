import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.tsx';
import '@/styles/globals.css';
import { initializeStorage } from '@/shared/config/storage.config';

// Initialize storage configuration based on environment
initializeStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);