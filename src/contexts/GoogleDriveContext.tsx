import { createContext, useContext, ReactNode } from 'react'
import { useGoogleDrive } from '../hooks/useGoogleDrive'

interface GoogleDriveContextType {
  isConnected: boolean
  isLoading: boolean
  isSyncing: boolean
  lastSyncedAt: string | null
  error: string | null
  isConfigured: boolean
  connect: () => void
  disconnect: () => void
  syncToCloud: () => Promise<void>
  syncFromCloud: () => Promise<boolean>
}

const GoogleDriveContext = createContext<GoogleDriveContextType | null>(null)

interface GoogleDriveProviderProps {
  children: ReactNode
  onDataImported?: () => void
}

export function GoogleDriveProvider({ children, onDataImported }: GoogleDriveProviderProps) {
  const googleDrive = useGoogleDrive({ onDataImported })

  return (
    <GoogleDriveContext.Provider value={googleDrive}>
      {children}
    </GoogleDriveContext.Provider>
  )
}

export function useGoogleDriveContext() {
  const context = useContext(GoogleDriveContext)
  if (!context) {
    throw new Error('useGoogleDriveContext must be used within a GoogleDriveProvider')
  }
  return context
}
