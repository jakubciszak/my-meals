import { useMemo, useRef } from 'react'
import { useMeals } from '../hooks/useMeals'
import { useFamilyMembers } from '../hooks/useFamilyMembers'

interface UniqueMeal {
  name: string
  lastDate: string
  likes: string[]
  dislikes: string[]
}

export default function MealsListPage() {
  const { meals, isLoading } = useMeals()
  const { members, isLoading: membersLoading } = useFamilyMembers()
  const tableRef = useRef<HTMLTableElement>(null)

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    return member?.name || 'Nieznany'
  }

  const uniqueMeals = useMemo((): UniqueMeal[] => {
    const mealMap = new Map<string, UniqueMeal>()

    // Sort meals by date descending so we encounter the newest first
    const sorted = [...meals].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    for (const meal of sorted) {
      const key = meal.name.toLowerCase()

      if (!mealMap.has(key)) {
        // First occurrence is the most recent (already sorted descending)
        const likesSet = new Set<string>()
        const dislikesSet = new Set<string>()

        // Aggregate ratings from all entries of this meal
        const allEntries = meals.filter(
          m => m.name.toLowerCase() === key
        )

        // Use a map to get the most recent rating per member
        const memberRatings = new Map<string, boolean>()
        const entriesByDate = [...allEntries].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        for (const entry of entriesByDate) {
          for (const rating of entry.ratings) {
            if (!memberRatings.has(rating.memberId)) {
              memberRatings.set(rating.memberId, rating.liked)
            }
          }
        }

        memberRatings.forEach((liked, memberId) => {
          if (liked) {
            likesSet.add(getMemberName(memberId))
          } else {
            dislikesSet.add(getMemberName(memberId))
          }
        })

        mealMap.set(key, {
          name: meal.name,
          lastDate: meal.date,
          likes: Array.from(likesSet),
          dislikes: Array.from(dislikesSet),
        })
      }
    }

    return Array.from(mealMap.values()).sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'pl')
    )
  }, [meals, members])

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const handleExportPDF = () => {
    if (uniqueMeals.length === 0) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const rows = uniqueMeals
      .map(
        (meal) => `
        <tr>
          <td>${escapeHtml(meal.name)}</td>
          <td>${formatDate(meal.lastDate)}</td>
          <td>${escapeHtml(meal.likes.join(', ') || '-')}</td>
          <td>${escapeHtml(meal.dislikes.join(', ') || '-')}</td>
        </tr>`
      )
      .join('')

    printWindow.document.write(`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Lista posilkow</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #1a1a1a; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #f3f4f6; text-align: left; padding: 10px 12px; border-bottom: 2px solid #d1d5db; font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
    tr:last-child td { border-bottom: none; }
    .footer { margin-top: 20px; font-size: 12px; color: #999; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>Lista posilkow</h1>
  <p class="subtitle">Wygenerowano: ${new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  <table>
    <thead>
      <tr>
        <th>Posilek</th>
        <th>Ostatnio</th>
        <th>Polubili</th>
        <th>Nie polubili</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="footer">Liczba unikalnych posilkow: ${uniqueMeals.length}</p>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`)
    printWindow.document.close()
  }

  return (
    <div className="px-4 py-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista posilkow</h1>
          <p className="text-gray-500">Unikalne posilki i preferencje</p>
        </div>
        {uniqueMeals.length > 0 && (
          <button
            onClick={handleExportPDF}
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
            <span className="hidden sm:inline">Eksportuj PDF</span>
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
          <div className="overflow-x-auto">
            <table ref={tableRef} className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Posilek</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Ostatnio</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Polubili</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Nie polubili</th>
                </tr>
              </thead>
              <tbody>
                {uniqueMeals.map((meal) => (
                  <tr key={meal.name.toLowerCase()} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{meal.name}</td>
                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{formatDate(meal.lastDate)}</td>
                    <td className="py-3 px-3">
                      {meal.likes.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                          </span>
                          <span className="text-gray-600">{meal.likes.join(', ')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {meal.dislikes.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                            </svg>
                          </span>
                          <span className="text-gray-600">{meal.dislikes.join(', ')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-gray-400 mt-4">
              Liczba unikalnych posilkow: {uniqueMeals.length}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
