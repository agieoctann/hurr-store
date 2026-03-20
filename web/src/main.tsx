import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Clear potentially stale localStorage on module load
try {
  const user = localStorage.getItem('user');
  if (user) JSON.parse(user); // validate JSON, throws if invalid
} catch {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
