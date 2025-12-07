import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css'; // Removed default CSS import
import App from './App';
import './i18n'; // Import i18n configuration
// import reportWebVitals from './reportWebVitals'; // Removed web vitals import

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// reportWebVitals(); // Removed web vitals call 