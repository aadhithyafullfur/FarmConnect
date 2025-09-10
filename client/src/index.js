import React from 'react';
import ReactDOM from 'react-dom/client';  // ✅ use react-dom/client
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ✅ Create root instead of using render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
