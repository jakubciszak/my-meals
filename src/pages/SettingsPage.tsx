import { useState } from 'react'
import { useGoogleDriveContext } from '../contexts/GoogleDriveContext'
import { useMeals } from '../hooks/useMeals'
import { useFamilyMembers } from '../hooks/useFamilyMembers'

export default function SettingsPage() {
  const {
    isConnected,
    isLoading,
    isSyncing,
    lastSyncedAt,
    error,
    isConfigured,
    connect,
    disconnect,
    syncToCloud,
    syncFromCloud,
  } = useGoogleDriveContext()

  const { meals, exportToCSV } = useMeals()
  const { members } = useFamilyMembers()

  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const handleSyncToCloud = async () => {
    setSyncMessage(null)
    try {
      await syncToCloud()
      setSyncMessage('Dane zostały zapisane w Google Drive')
    } catch {
      // Error is already set in the hook
    }
  }

  const handleSyncFromCloud = async () => {
    setSyncMessage(null)
    try {
      const hasData = await syncFromCloud()
      if (hasData) {
        setSyncMessage('Dane zostały pobrane z Google Drive. Strona zostanie odświeżona...')
      } else {
        setSyncMessage('Brak danych w Google Drive')
      }
    } catch {
      // Error is already set in the hook
    }
  }

  const handleExportCSV = () => {
    exportToCSV(members)
  }

  const handleClearData = () => {
    if (window.confirm('Czy na pewno chcesz usunąć wszystkie dane? Ta operacja jest nieodwracalna.')) {
      localStorage.removeItem('my-meals-data')
      localStorage.removeItem('my-meals-family')
      window.location.reload()
    }
  }

  const formatLastSync = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ustawienia</h1>
        <p className="text-gray-500">Konfiguracja aplikacji</p>
      </header>

      <section className="space-y-4">
        <div className="card">
          <h2 className="font-semibold mb-2">Google Drive</h2>

          {!isConfigured ? (
            <div className="text-sm text-gray-500">
              <p className="mb-2">
                Synchronizacja z Google Drive nie jest skonfigurowana.
              </p>
              <p className="text-xs text-gray-400">
                Aby włączyć synchronizację, ustaw zmienną VITE_GOOGLE_CLIENT_ID
                w ustawieniach środowiska.
              </p>
            </div>
          ) : !isConnected ? (
            <>
              <p className="text-sm text-gray-500 mb-3">
                Połącz z Google Drive, aby synchronizować dane między urządzeniami.
              </p>
              <button
                onClick={connect}
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <SpinnerIcon className="w-4 h-4 animate-spin" />
                    Łączenie...
                  </>
                ) : (
                  <>
                    <GoogleDriveIcon className="w-5 h-5" />
                    Połącz z Google Drive
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                <CheckIcon className="w-4 h-4" />
                <span>Połączono z Google Drive</span>
              </div>

              {lastSyncedAt && (
                <p className="text-xs text-gray-400 mb-3">
                  Ostatnia synchronizacja: {formatLastSync(lastSyncedAt)}
                </p>
              )}

              <div className="flex gap-2 mb-3">
                <button
                  onClick={handleSyncToCloud}
                  disabled={isSyncing}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isSyncing ? (
                    <SpinnerIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadIcon className="w-4 h-4" />
                  )}
                  Wyślij
                </button>
                <button
                  onClick={handleSyncFromCloud}
                  disabled={isSyncing}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  {isSyncing ? (
                    <SpinnerIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <DownloadIcon className="w-4 h-4" />
                  )}
                  Pobierz
                </button>
              </div>

              <button
                onClick={disconnect}
                className="btn-ghost w-full text-red-600 hover:bg-red-50"
              >
                Rozłącz
              </button>
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 mt-3">{error}</p>
          )}

          {syncMessage && !error && (
            <p className="text-sm text-green-600 mt-3">{syncMessage}</p>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">Dane lokalne</h2>
          <p className="text-sm text-gray-500 mb-3">
            Eksportuj historię obiadów do pliku CSV lub wyczyść wszystkie dane.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={meals.length === 0}
              className="btn-secondary flex-1"
            >
              Eksportuj CSV
            </button>
            <button
              onClick={handleClearData}
              className="btn-ghost flex-1 text-red-600 hover:bg-red-50"
            >
              Wyczyść dane
            </button>
          </div>
          {meals.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Brak danych do eksportu.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function GoogleDriveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.71 3.5L1.15 15l3.43 5.96L11.14 9.48 7.71 3.5zm8.58 0H7.71l6.86 11.98h8.58L16.29 3.5zm-2.28 13.48H5.43L2 22.5h17.14l-5.13-5.52z" />
    </svg>
  )
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}
