export default function FamilyPage() {
  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rodzina</h1>
        <p className="text-gray-500">Zarządzaj członkami rodziny</p>
      </header>

      <section className="mb-6">
        <button className="btn-primary w-full">
          Dodaj członka rodziny
        </button>
      </section>

      <section>
        <p className="text-gray-500 text-center py-8">
          Brak dodanych członków rodziny.
        </p>
      </section>
    </div>
  )
}
