import { useState } from 'react'
import { useMeals } from '../hooks/useMeals'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import type { Meal, FamilyMember } from '../types'

interface MealRatingButtonsProps {
  meal: Meal
  member: FamilyMember
  onRate: (mealId: string, memberId: string, liked: boolean | null) => void
}

function MealRatingButtons({ meal, member, onRate }: MealRatingButtonsProps) {
  const existingRating = meal.ratings.find(r => r.memberId === member.id)

  const handleLike = () => {
    if (existingRating?.liked === true) {
      onRate(meal.id, member.id, null)
    } else {
      onRate(meal.id, member.id, true)
    }
  }

  const handleDislike = () => {
    if (existingRating?.liked === false) {
      onRate(meal.id, member.id, null)
    } else {
      onRate(meal.id, member.id, false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
        {member.name.charAt(0).toUpperCase()}
      </div>
      <span className="text-sm text-gray-700 min-w-[60px]">{member.name}</span>
      <div className="flex gap-1">
        <button
          onClick={handleLike}
          className={`p-1.5 rounded-full transition-colors ${
            existingRating?.liked === true
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
          }`}
          aria-label={`${member.name} lubi ${meal.name}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
        </button>
        <button
          onClick={handleDislike}
          className={`p-1.5 rounded-full transition-colors ${
            existingRating?.liked === false
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'
          }`}
          aria-label={`${member.name} nie lubi ${meal.name}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [mealInput, setMealInput] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [ingredientsInput, setIngredientsInput] = useState('')
  const [showIngredients, setShowIngredients] = useState(false)
  const { addMeal, getMealsByDate, deleteMeal, updateMealRating, isLoading } = useMeals()
  const { members, isLoading: membersLoading } = useFamilyMembers()

  const todayStr = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === todayStr
  const selectedMeals = getMealsByDate(selectedDate)

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Dzisiaj'
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Wczoraj'
    } else {
      return date.toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    }
  }

  const today = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const handleAddMeal = () => {
    if (!mealInput.trim()) return
    const ingredients = ingredientsInput
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0)
    addMeal(mealInput, selectedDate, ingredients)
    setMealInput('')
    setIngredientsInput('')
    setShowIngredients(false)
  }

  const handleDeleteMeal = (id: string) => {
    deleteMeal(id)
  }

  const handleRate = (mealId: string, memberId: string, liked: boolean | null) => {
    updateMealRating(mealId, memberId, liked)
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
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={mealInput}
                onChange={(e) => setMealInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !showIngredients && handleAddMeal()}
                placeholder="Co bylo na obiad?"
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
            <div className="flex gap-2 items-center">
              <label className="text-sm text-gray-600">Data:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={todayStr}
                className="input flex-1"
                aria-label="Data obiadu"
              />
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-sm text-primary hover:underline"
                >
                  Dzisiaj
                </button>
              )}
            </div>
            <div>
              <button
                onClick={() => setShowIngredients(!showIngredients)}
                className="text-sm text-gray-600 hover:text-primary flex items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform ${showIngredients ? 'rotate-90' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Dodaj skladniki (opcjonalnie)
              </button>
              {showIngredients && (
                <input
                  type="text"
                  value={ingredientsInput}
                  onChange={(e) => setIngredientsInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMeal()}
                  placeholder="np. kurczak, ryz, warzywa"
                  className="input w-full mt-2"
                  aria-label="Skladniki obiadu"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Posilki: {formatDateHeader(selectedDate)}
        </h2>
        <div className="space-y-3">
          {isLoading || membersLoading ? (
            <p className="text-gray-500 text-center py-8">Ladowanie...</p>
          ) : selectedMeals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Brak obiadow na {isToday ? 'dzis' : 'ten dzien'}. Dodaj pierwszy!
            </p>
          ) : (
            selectedMeals.map((meal) => (
              <div key={meal.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{meal.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(meal.createdAt).toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Skladniki: {meal.ingredients.join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteMeal(meal.id)}
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
                {members.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-500 mb-2">Oceny:</p>
                    <div className="space-y-2">
                      {members.map((member) => (
                        <MealRatingButtons
                          key={member.id}
                          meal={meal}
                          member={member}
                          onRate={handleRate}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
