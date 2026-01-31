import { useMeals } from '../hooks/useMeals'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import type { Meal, FamilyMember } from '../types'

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

interface MealRatingSummaryProps {
  meal: Meal
  members: FamilyMember[]
}

function MealRatingSummary({ meal, members }: MealRatingSummaryProps) {
  if (members.length === 0 || meal.ratings.length === 0) {
    return null
  }

  const likes = meal.ratings.filter(r => r.liked)
  const dislikes = meal.ratings.filter(r => !r.liked)

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    return member?.name || 'Nieznany'
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {likes.length > 0 && (
        <div className="flex items-center gap-1 text-sm" data-testid="likes-summary">
          <span className="text-green-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 inline"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
          </span>
          <span className="text-gray-600">
            {likes.map(r => getMemberName(r.memberId)).join(', ')}
          </span>
        </div>
      )}
      {dislikes.length > 0 && (
        <div className="flex items-center gap-1 text-sm" data-testid="dislikes-summary">
          <span className="text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 inline"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
            </svg>
          </span>
          <span className="text-gray-600">
            {dislikes.map(r => getMemberName(r.memberId)).join(', ')}
          </span>
        </div>
      )}
    </div>
  )
}

export default function MealsPage() {
  const { getMealsGroupedByDate, deleteMeal, isLoading } = useMeals()
  const { members, isLoading: membersLoading } = useFamilyMembers()

  const groupedMeals = getMealsGroupedByDate()

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historia obiadow</h1>
        <p className="text-gray-500">Przegladaj wczesniejsze posilki</p>
      </header>

      <section>
        {isLoading || membersLoading ? (
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
                      className="card"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{meal.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(meal.createdAt).toLocaleTimeString('pl-PL', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <MealRatingSummary meal={meal} members={members} />
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
