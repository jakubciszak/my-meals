import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { GoogleDriveProvider } from './contexts/GoogleDriveContext'
import { GoogleSheetsProvider } from './contexts/GoogleSheetsContext'
import './index.css'

const handleDataImported = () => {
  // Reload the page to reflect imported data
  window.location.reload()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <GoogleDriveProvider onDataImported={handleDataImported}>
        <GoogleSheetsProvider onDataImported={handleDataImported}>
          <App />
        </GoogleSheetsProvider>
      </GoogleDriveProvider>
    </HashRouter>
  </StrictMode>,
)
