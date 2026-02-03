import { createContext, useContext, ReactNode } from 'react'
import { useGoogleSheets } from '../hooks/useGoogleSheets'

interface GoogleSheetsContextType {
  isConnected: boolean
  isLoading: boolean
  isSyncing: boolean
  lastSyncedAt: string | null
  error: string | null
  isConfigured: boolean
  spreadsheetId: string | null
  connect: () => void
  disconnect: () => void
  updateSpreadsheetId: (id: string | null) => void
  syncToCloud: () => Promise<void>
  syncFromCloud: () => Promise<boolean>
  sync: () => Promise<void>
}

const GoogleSheetsContext = createContext<GoogleSheetsContextType | null>(null)

interface GoogleSheetsProviderProps {
  children: ReactNode
  onDataImported?: () => void
}

export function GoogleSheetsProvider({ children, onDataImported }: GoogleSheetsProviderProps) {
  const googleSheets = useGoogleSheets({ onDataImported })

  return (
    <GoogleSheetsContext.Provider value={googleSheets}>
      {children}
    </GoogleSheetsContext.Provider>
  )
}

export function useGoogleSheetsContext() {
  const context = useContext(GoogleSheetsContext)
  if (!context) {
    throw new Error('useGoogleSheetsContext must be used within a GoogleSheetsProvider')
  }
  return context
}
