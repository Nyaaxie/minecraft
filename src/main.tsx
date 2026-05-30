import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Direct Storage Test
try {
  localStorage.setItem('strawberry_storage_test', Date.now().toString());
} catch (e) {
  // Storage test failed
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
