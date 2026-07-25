import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Register brand logo icon subset locally — eliminates CDN dependency
import './lib/iconify-bundle'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
