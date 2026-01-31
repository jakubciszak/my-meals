import { useMeals } from '../hooks/useMeals'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateOnly = dateString.split('T')[0]
  const todayOnly = today.toISOString().split('T')[0]
  const yesterdayOnly = yesterday.toISOString().split('T')[0]

  if (dateOnly === todayOnly) {
    return 'Dzisiaj'
  }
  if (dateOnly === yesterdayOnly) {
    return 'Wczoraj'
  }

  return date.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function MealsPage() {
  const { getMealsGroupedByDate, deleteMeal, isLoading } = useMeals()

  const groupedMeals = getMealsGroupedByDate()

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historia obiadow</h1>
        <p className="text-gray-500">Przegladaj wczesniejsze posilki</p>
      </header>

      <section>
        {isLoading ? (
          <p className="text-gray-500 text-center py-8">Ladowanie...</p>
        ) : groupedMeals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Brak zapisanych obiadow.
          </p>
        ) : (
          <div className="space-y-6">
            {groupedMeals.map(({ date, meals }) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {formatDate(date)}
                </h2>
                <div className="space-y-2">
                  {meals.map((meal) => (
                    <div
                      key={meal.id}
                      className="card flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{meal.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(meal.createdAt).toLocaleTimeString('pl-PL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteMeal(meal.id)}
                        className="btn-ghost text-red-500 hover:text-red-700 p-2"
                        aria-label={`Usun ${meal.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
