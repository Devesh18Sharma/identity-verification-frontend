// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/global.css' // Import global styles

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error("Could not find root element to mount React app.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)