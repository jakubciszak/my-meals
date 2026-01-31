import { useState } from 'react'

export default function HomePage() {
  const [mealInput, setMealInput] = useState('')

  const today = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const handleAddMeal = () => {
    if (!mealInput.trim()) return
    // TODO: Implement adding meal
    setMealInput('')
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
          <p className="text-gray-500 text-center py-8">
            Brak obiadów na dziś. Dodaj pierwszy!
          </p>
        </div>
      </section>
    </div>
  )
}
