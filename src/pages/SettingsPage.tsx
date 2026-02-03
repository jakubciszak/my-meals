import { useState, useEffect } from 'react'
import { useGoogleDriveContext } from '../contexts/GoogleDriveContext'
import { useGoogleSheetsContext } from '../contexts/GoogleSheetsContext'
import { useMeals } from '../hooks/useMeals'
import { useFamilyMembers } from '../hooks/useFamilyMembers'

export default function SettingsPage() {
  const {
    isConnected: isDriveConnected,
    isLoading: isDriveLoading,
    isSyncing: isDriveSyncing,
    lastSyncedAt: driveLastSyncedAt,
    error: driveError,
    isConfigured: isDriveConfigured,
    connect: driveConnect,
    disconnect: driveDisconnect,
    syncToCloud: driveSyncToCloud,
    syncFromCloud: driveSyncFromCloud,
    sync: driveSync,
  } = useGoogleDriveContext()

  const {
    isConnected: isSheetsConnected,
    isLoading: isSheetsLoading,
    isSyncing: isSheetsSyncing,
    lastSyncedAt: sheetsLastSyncedAt,
    error: sheetsError,
    isConfigured: isSheetsConfigured,
    spreadsheetId,
    spreadsheets,
    isLoadingSpreadsheets,
    connect: sheetsConnect,
    disconnect: sheetsDisconnect,
    updateSpreadsheetId,
    listSpreadsheets,
    createSpreadsheet,
    syncToCloud: sheetsSyncToCloud,
    syncFromCloud: sheetsSyncFromCloud,
    sync: sheetsSync,
  } = useGoogleSheetsContext()

  const { meals, exportToCSV } = useMeals()
  const { members } = useFamilyMembers()

  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [sheetsSyncMessage, setSheetsSyncMessage] = useState<string | null>(null)
  const [newSpreadsheetName, setNewSpreadsheetName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Load spreadsheets list when connected
  useEffect(() => {
    if (isSheetsConnected) {
      listSpreadsheets()
    }
  }, [isSheetsConnected, listSpreadsheets])

  // Google Drive handlers
  const handleDriveSyncToCloud = async () => {
    setSyncMessage(null)
    try {
      await driveSyncToCloud()
      setSyncMessage('Dane zostały zapisane w Google Drive')
    } catch {
      // Error is already set in the hook
    }
  }

  const handleDriveSyncFromCloud = async () => {
    setSyncMessage(null)
    try {
      const hasData = await driveSyncFromCloud()
      if (hasData) {
        setSyncMessage('Dane zostały pobrane z Google Drive. Strona zostanie odświeżona...')
      } else {
        setSyncMessage('Brak danych w Google Drive')
      }
    } catch {
      // Error is already set in the hook
    }
  }

  const handleDriveSync = async () => {
    setSyncMessage(null)
    try {
      await driveSync()
      setSyncMessage('Dane zostały zsynchronizowane. Strona zostanie odświeżona...')
    } catch {
      // Error is already set in the hook
    }
  }

  // Google Sheets handlers
  const handleSheetsSyncToCloud = async () => {
    setSheetsSyncMessage(null)
    try {
      await sheetsSyncToCloud()
      setSheetsSyncMessage('Dane zostały zapisane w Google Sheets')
    } catch {
      // Error is already set in the hook
    }
  }

  const handleSheetsSyncFromCloud = async () => {
    setSheetsSyncMessage(null)
    try {
      const hasData = await sheetsSyncFromCloud()
      if (hasData) {
        setSheetsSyncMessage('Dane zostały pobrane z Google Sheets. Strona zostanie odświeżona...')
      } else {
        setSheetsSyncMessage('Brak danych w Google Sheets')
      }
    } catch {
      // Error is already set in the hook
    }
  }

  const handleSheetsSync = async () => {
    setSheetsSyncMessage(null)
    try {
      await sheetsSync()
      setSheetsSyncMessage('Dane zostały zsynchronizowane. Strona zostanie odświeżona...')
    } catch {
      // Error is already set in the hook
    }
  }

  const handleSpreadsheetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    updateSpreadsheetId(id || null)
  }

  const handleCreateSpreadsheet = async () => {
    if (!newSpreadsheetName.trim()) return
    const id = await createSpreadsheet(newSpreadsheetName.trim())
    if (id) {
      setNewSpreadsheetName('')
      setShowCreateForm(false)
      setSheetsSyncMessage('Utworzono nowy arkusz. Możesz go teraz udostępnić innym osobom.')
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
          <h2 className="font-semibold mb-2">Google Sheets (współdzielone)</h2>
          <p className="text-xs text-gray-400 mb-3">
            Idealne do współdzielenia danych z rodziną. Utwórz arkusz Google i udostępnij go innym osobom.
          </p>

          {!isSheetsConfigured ? (
            <div className="text-sm text-gray-500">
              <p className="mb-2">
                Synchronizacja z Google Sheets nie jest skonfigurowana.
              </p>
              <p className="text-xs text-gray-400">
                Aby włączyć synchronizację, ustaw zmienną VITE_GOOGLE_CLIENT_ID
                w ustawieniach środowiska.
              </p>
            </div>
          ) : !isSheetsConnected ? (
            <button
              onClick={sheetsConnect}
              disabled={isSheetsLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSheetsLoading ? (
                <>
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                  Łączenie...
                </>
              ) : (
                <>
                  <GoogleSheetsIcon className="w-5 h-5" />
                  Połącz z Google Sheets
                </>
              )}
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                <CheckIcon className="w-4 h-4" />
                <span>Połączono z Google Sheets</span>
              </div>

              {/* Spreadsheet selector */}
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">
                  Wybierz arkusz
                </label>
                <select
                  value={spreadsheetId || ''}
                  onChange={handleSpreadsheetSelect}
                  disabled={isLoadingSpreadsheets}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">-- Wybierz arkusz --</option>
                  {spreadsheets.map((sheet) => (
                    <option key={sheet.id} value={sheet.id}>
                      {sheet.name}
                    </option>
                  ))}
                </select>
                {isLoadingSpreadsheets && (
                  <p className="text-xs text-gray-400 mt-1">Ładowanie listy arkuszy...</p>
                )}
              </div>

              {/* Create new spreadsheet */}
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-ghost w-full text-sm mb-3"
                >
                  + Utwórz nowy arkusz
                </button>
              ) : (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <label className="block text-sm text-gray-600 mb-1">
                    Nazwa nowego arkusza
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSpreadsheetName}
                      onChange={(e) => setNewSpreadsheetName(e.target.value)}
                      placeholder="np. Obiady rodzina Kowalskich"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={handleCreateSpreadsheet}
                      disabled={isLoadingSpreadsheets || !newSpreadsheetName.trim()}
                      className="btn-primary px-3"
                    >
                      {isLoadingSpreadsheets ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : 'Utwórz'}
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-xs text-gray-500 mt-2"
                  >
                    Anuluj
                  </button>
                </div>
              )}

              {sheetsLastSyncedAt && (
                <p className="text-xs text-gray-400 mb-3">
                  Ostatnia synchronizacja: {formatLastSync(sheetsLastSyncedAt)}
                </p>
              )}

              {spreadsheetId ? (
                <>
                  <button
                    onClick={handleSheetsSync}
                    disabled={isSheetsSyncing}
                    className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
                  >
                    {isSheetsSyncing ? (
                      <SpinnerIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <SyncIcon className="w-4 h-4" />
                    )}
                    Synchronizuj
                  </button>

                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={handleSheetsSyncToCloud}
                      disabled={isSheetsSyncing}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                    >
                      {isSheetsSyncing ? (
                        <SpinnerIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <UploadIcon className="w-4 h-4" />
                      )}
                      Wyślij
                    </button>
                    <button
                      onClick={handleSheetsSyncFromCloud}
                      disabled={isSheetsSyncing}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                    >
                      {isSheetsSyncing ? (
                        <SpinnerIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <DownloadIcon className="w-4 h-4" />
                      )}
                      Pobierz
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-amber-600 mb-3">
                  Wybierz arkusz z listy powyżej, aby rozpocząć synchronizację.
                </p>
              )}

              <button
                onClick={sheetsDisconnect}
                className="btn-ghost w-full text-red-600 hover:bg-red-50"
              >
                Rozłącz
              </button>

              {sheetsError && (
                <p className="text-sm text-red-600 mt-3">{sheetsError}</p>
              )}

              {sheetsSyncMessage && !sheetsError && (
                <p className="text-sm text-green-600 mt-3">{sheetsSyncMessage}</p>
              )}
            </>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">Google Drive (prywatne)</h2>
          <p className="text-xs text-gray-400 mb-3">
            Synchronizacja na Twój prywatny dysk Google Drive.
          </p>

          {!isDriveConfigured ? (
            <div className="text-sm text-gray-500">
              <p className="mb-2">
                Synchronizacja z Google Drive nie jest skonfigurowana.
              </p>
              <p className="text-xs text-gray-400">
                Aby włączyć synchronizację, ustaw zmienną VITE_GOOGLE_CLIENT_ID
                w ustawieniach środowiska.
              </p>
            </div>
          ) : !isDriveConnected ? (
            <>
              <p className="text-sm text-gray-500 mb-3">
                Połącz z Google Drive, aby synchronizować dane między urządzeniami.
              </p>
              <button
                onClick={driveConnect}
                disabled={isDriveLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isDriveLoading ? (
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

              {driveLastSyncedAt && (
                <p className="text-xs text-gray-400 mb-3">
                  Ostatnia synchronizacja: {formatLastSync(driveLastSyncedAt)}
                </p>
              )}

              <button
                onClick={handleDriveSync}
                disabled={isDriveSyncing}
                className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
              >
                {isDriveSyncing ? (
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <SyncIcon className="w-4 h-4" />
                )}
                Synchronizuj
              </button>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={handleDriveSyncToCloud}
                  disabled={isDriveSyncing}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  {isDriveSyncing ? (
                    <SpinnerIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadIcon className="w-4 h-4" />
                  )}
                  Wyślij
                </button>
                <button
                  onClick={handleDriveSyncFromCloud}
                  disabled={isDriveSyncing}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  {isDriveSyncing ? (
                    <SpinnerIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <DownloadIcon className="w-4 h-4" />
                  )}
                  Pobierz
                </button>
              </div>

              <button
                onClick={driveDisconnect}
                className="btn-ghost w-full text-red-600 hover:bg-red-50"
              >
                Rozłącz
              </button>
            </>
          )}

          {driveError && (
            <p className="text-sm text-red-600 mt-3">{driveError}</p>
          )}

          {syncMessage && !driveError && (
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

function GoogleSheetsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4v4z" />
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

function SyncIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}
