import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

console.log('FitForge app starting...');

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Root element found, mounting React app');
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found!');
}