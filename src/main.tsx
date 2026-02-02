import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { GoogleDriveProvider } from './contexts/GoogleDriveContext'
import './index.css'

const handleDataImported = () => {
  // Reload the page to reflect imported data
  window.location.reload()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/my-meals">
      <GoogleDriveProvider onDataImported={handleDataImported}>
        <App />
      </GoogleDriveProvider>
    </BrowserRouter>
  </StrictMode>,
)
