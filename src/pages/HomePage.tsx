import { useState } from 'react'
import { useMeals } from '../hooks/useMeals'

export default function HomePage() {
  const [mealInput, setMealInput] = useState('')
  const { addMeal, getTodaysMeals, deleteMeal, isLoading } = useMeals()

  const todaysMeals = getTodaysMeals()

  const today = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const handleAddMeal = () => {
    if (!mealInput.trim()) return
    addMeal(mealInput)
    setMealInput('')
  }

  const handleDeleteMeal = (id: string) => {
    deleteMeal(id)
  }

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dzisiejsze obiady</h1>
        <p className="text-gray-500 capitalize">{today}</p>
      </header>

      <section className="mb-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Dodaj obiad</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={mealInput}
              onChange={(e) => setMealInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMeal()}
              placeholder="Co było na obiad?"
              className="input flex-1"
              aria-label="Nazwa obiadu"
            />
            <button
              onClick={handleAddMeal}
              className="btn-primary"
              aria-label="Dodaj obiad"
            >
              Dodaj
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Dzisiejsze posiłki</h2>
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-gray-500 text-center py-8">Ładowanie...</p>
          ) : todaysMeals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Brak obiadów na dziś. Dodaj pierwszy!
            </p>
          ) : (
            todaysMeals.map((meal) => (
              <div key={meal.id} className="card flex items-center justify-between">
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
                  onClick={() => handleDeleteMeal(meal.id)}
                  className="btn-ghost text-red-500 hover:text-red-700 p-2"
                  aria-label={`Usuń ${meal.name}`}
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
            ))
          )}
        </div>
      </section>
    </div>
  )
}
