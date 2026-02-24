import { useMemo } from 'react'
import { useMeals } from '../hooks/useMeals'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import type { Meal, FamilyMember } from '../types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface UniqueMeal {
  name: string
  lastServedDate: string
  likedBy: string[]
  dislikedBy: string[]
}

function buildUniqueMeals(meals: Meal[], members: FamilyMember[]): UniqueMeal[] {
  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    return member?.name || 'Nieznany'
  }

  const mealMap = new Map<string, { lastServedDate: string; likedBySet: Set<string>; dislikedBySet: Set<string> }>()

  // Sort meals by date descending so we process newest first
  const sortedMeals = [...meals].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (const meal of sortedMeals) {
    const key = meal.name.toLowerCase()

    if (!mealMap.has(key)) {
      mealMap.set(key, {
        lastServedDate: meal.date,
        likedBySet: new Set<string>(),
        dislikedBySet: new Set<string>(),
      })
    }

    const entry = mealMap.get(key)!

    // Update last served date if this one is more recent
    if (meal.date > entry.lastServedDate) {
      entry.lastServedDate = meal.date
    }

    // Aggregate ratings - collect all unique members who liked/disliked
    for (const rating of meal.ratings) {
      const name = getMemberName(rating.memberId)
      if (rating.liked) {
        entry.likedBySet.add(name)
        entry.dislikedBySet.delete(name) // If liked in newer entry, remove from disliked
      } else {
        entry.dislikedBySet.add(name)
        entry.likedBySet.delete(name)
      }
    }
  }

  const uniqueMeals: UniqueMeal[] = []

  // We need to use the original casing from the first (most recent) occurrence
  const nameMap = new Map<string, string>()
  for (const meal of sortedMeals) {
    const key = meal.name.toLowerCase()
    if (!nameMap.has(key)) {
      nameMap.set(key, meal.name)
    }
  }

  for (const [key, entry] of mealMap.entries()) {
    uniqueMeals.push({
      name: nameMap.get(key) || key,
      lastServedDate: entry.lastServedDate,
      likedBy: Array.from(entry.likedBySet),
      dislikedBy: Array.from(entry.dislikedBySet),
    })
  }

  // Sort by last served date descending
  uniqueMeals.sort((a, b) =>
    new Date(b.lastServedDate).getTime() - new Date(a.lastServedDate).getTime()
  )

  return uniqueMeals
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayOnly = today.toISOString().split('T')[0]
  const yesterdayOnly = yesterday.toISOString().split('T')[0]

  if (dateString === todayOnly) {
    return 'Dzisiaj'
  }
  if (dateString === yesterdayOnly) {
    return 'Wczoraj'
  }

  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateForPdf(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function exportToPdf(uniqueMeals: UniqueMeal[]) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Lista posilkow', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Wygenerowano: ${new Date().toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    14,
    28,
  )

  doc.setTextColor(0, 0, 0)

  const tableData = uniqueMeals.map((meal, index) => [
    String(index + 1),
    meal.name,
    formatDateForPdf(meal.lastServedDate),
    meal.likedBy.length > 0 ? meal.likedBy.join(', ') : '-',
    meal.dislikedBy.length > 0 ? meal.dislikedBy.join(', ') : '-',
  ])

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Posilek', 'Ostatnio serwowany', 'Polubili', 'Nie polubili']],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [238, 117, 26], // primary color #ee751a
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // gray-50
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 40 },
      3: { cellWidth: 45 },
      4: { cellWidth: 40 },
    },
  })

  doc.save(`lista-posilkow-${new Date().toISOString().split('T')[0]}.pdf`)
}

export default function MealsListPage() {
  const { meals, isLoading } = useMeals()
  const { members, isLoading: membersLoading } = useFamilyMembers()

  const uniqueMeals = useMemo(
    () => buildUniqueMeals(meals, members),
    [meals, members],
  )

  const handleExportPdf = () => {
    if (uniqueMeals.length === 0) return
    exportToPdf(uniqueMeals)
  }

  return (
    <div className="px-4 py-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista posilkow</h1>
          <p className="text-gray-500">
            {uniqueMeals.length > 0
              ? `${uniqueMeals.length} unikalnych posilkow`
              : 'Przegladaj wszystkie posilki'}
          </p>
        </div>
        {uniqueMeals.length > 0 && (
          <button
            onClick={handleExportPdf}
            className="btn-secondary flex items-center gap-2"
            aria-label="Eksportuj do PDF"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline">Pobierz PDF</span>
          </button>
        )}
      </header>

      <section>
        {isLoading || membersLoading ? (
          <p className="text-gray-500 text-center py-8">Ladowanie...</p>
        ) : uniqueMeals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Brak zapisanych posilkow.
          </p>
        ) : (
          <div className="space-y-3">
            {uniqueMeals.map((meal) => (
              <div key={meal.name} className="card">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-gray-900">{meal.name}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {formatDate(meal.lastServedDate)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {meal.likedBy.length > 0 && (
                    <div className="flex items-center gap-1 text-sm">
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
                        {meal.likedBy.join(', ')}
                      </span>
                    </div>
                  )}
                  {meal.dislikedBy.length > 0 && (
                    <div className="flex items-center gap-1 text-sm">
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
                        {meal.dislikedBy.join(', ')}
                      </span>
                    </div>
                  )}
                  {meal.likedBy.length === 0 && meal.dislikedBy.length === 0 && (
                    <span className="text-sm text-gray-400">Brak ocen</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
