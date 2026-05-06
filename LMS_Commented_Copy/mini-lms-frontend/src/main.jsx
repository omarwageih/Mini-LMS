/**
 * Frontend Entry Point (main.jsx)
 * This file bootstraps the React application and provides global context providers.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './style.css' // Import global styles (including Tailwind/CSS)
import { ThemeProvider } from './context/ThemeContext' // Manages Light/Dark mode
import { ToastProvider } from './context/ToastContext' // Manages UI notifications (toasts)

// Render the application into the #root element in index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
)