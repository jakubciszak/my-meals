export default function SettingsPage() {
  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ustawienia</h1>
        <p className="text-gray-500">Konfiguracja aplikacji</p>
      </header>

      <section className="space-y-4">
        <div className="card">
          <h2 className="font-semibold mb-2">Synchronizacja</h2>
          <p className="text-sm text-gray-500 mb-3">
            Połącz z Google Drive, aby synchronizować dane między urządzeniami.
          </p>
          <button className="btn-secondary w-full">
            Połącz z Google Drive
          </button>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">Kalendarz Google</h2>
          <p className="text-sm text-gray-500 mb-3">
            Synchronizuj obiady z kalendarzem Google.
          </p>
          <button className="btn-secondary w-full">
            Połącz z Kalendarzem
          </button>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">Dane</h2>
          <p className="text-sm text-gray-500 mb-3">
            Eksportuj lub wyczyść wszystkie dane aplikacji.
          </p>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1">Eksportuj</button>
            <button className="btn-ghost flex-1 text-red-600 hover:bg-red-50">
              Wyczyść
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
