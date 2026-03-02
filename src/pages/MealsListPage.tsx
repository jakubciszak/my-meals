import { useState, useMemo } from 'react'
import { useMeals } from '../hooks/useMeals'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import type { Meal, FamilyMember } from '../types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface MealMemberInfo {
  id: string
  name: string
}

interface UniqueMeal {
  name: string
  lastServedDate: string
  likedBy: MealMemberInfo[]
  dislikedBy: MealMemberInfo[]
}

type SortColumn = 'name' | 'date' | 'likedCount' | 'dislikedCount'
type SortDirection = 'asc' | 'desc'

const SORT_LABELS: Record<SortColumn, string> = {
  name: 'Nazwa',
  date: 'Data',
  likedCount: 'Polubienia',
  dislikedCount: 'Niepolubienia',
}

function buildUniqueMeals(meals: Meal[], members: FamilyMember[]): UniqueMeal[] {
  const getMemberInfo = (memberId: string): MealMemberInfo => {
    const member = members.find(m => m.id === memberId)
    return { id: memberId, name: member?.name || 'Nieznany' }
  }

  const mealMap = new Map<string, {
    lastServedDate: string
    likedByMap: Map<string, MealMemberInfo>
    dislikedByMap: Map<string, MealMemberInfo>
  }>()

  // Sort meals by date descending so we process newest first
  const sortedMeals = [...meals].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (const meal of sortedMeals) {
    const key = meal.name.toLowerCase()

    if (!mealMap.has(key)) {
      mealMap.set(key, {
        lastServedDate: meal.date,
        likedByMap: new Map(),
        dislikedByMap: new Map(),
      })
    }

    const entry = mealMap.get(key)!

    if (meal.date > entry.lastServedDate) {
      entry.lastServedDate = meal.date
    }

    for (const rating of meal.ratings) {
      const info = getMemberInfo(rating.memberId)
      if (rating.liked) {
        entry.likedByMap.set(rating.memberId, info)
        entry.dislikedByMap.delete(rating.memberId)
      } else {
        entry.dislikedByMap.set(rating.memberId, info)
        entry.likedByMap.delete(rating.memberId)
      }
    }
  }

  // Preserve original casing from the most recent occurrence
  const nameMap = new Map<string, string>()
  for (const meal of sortedMeals) {
    const key = meal.name.toLowerCase()
    if (!nameMap.has(key)) {
      nameMap.set(key, meal.name)
    }
  }

  const uniqueMeals: UniqueMeal[] = []
  for (const [key, entry] of mealMap.entries()) {
    uniqueMeals.push({
      name: nameMap.get(key) || key,
      lastServedDate: entry.lastServedDate,
      likedBy: Array.from(entry.likedByMap.values()),
      dislikedBy: Array.from(entry.dislikedByMap.values()),
    })
  }

  return uniqueMeals
}

function sortMeals(meals: UniqueMeal[], column: SortColumn, direction: SortDirection): UniqueMeal[] {
  return [...meals].sort((a, b) => {
    let cmp = 0
    switch (column) {
      case 'name':
        cmp = a.name.localeCompare(b.name, 'pl')
        break
      case 'date':
        cmp = new Date(a.lastServedDate).getTime() - new Date(b.lastServedDate).getTime()
        break
      case 'likedCount':
        cmp = a.likedBy.length - b.likedBy.length
        break
      case 'dislikedCount':
        cmp = a.dislikedBy.length - b.dislikedBy.length
        break
    }
    return direction === 'asc' ? cmp : -cmp
  })
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

let fontCache: string | null = null

async function loadRobotoFont(): Promise<string> {
  if (fontCache) return fontCache
  const response = await fetch(`${import.meta.env.BASE_URL}fonts/Roboto.ttf`)
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  fontCache = btoa(binary)
  return fontCache
}

async function exportToPdf(uniqueMeals: UniqueMeal[]) {
  const doc = new jsPDF()

  // Register font that supports Polish characters
  const fontBase64 = await loadRobotoFont()
  doc.addFileToVFS('Roboto-Regular.ttf', fontBase64)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFileToVFS('Roboto-Bold.ttf', fontBase64)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
  doc.setFont('Roboto')

  doc.setFontSize(18)
  doc.text('Lista posiłków', 14, 20)

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
    meal.likedBy.length > 0 ? meal.likedBy.map(m => m.name).join(', ') : '-',
    meal.dislikedBy.length > 0 ? meal.dislikedBy.map(m => m.name).join(', ') : '-',
  ])

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Posiłek', 'Ostatnio serwowany', 'Polubili', 'Nie polubili']],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      font: 'Roboto',
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

  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [likedByMemberId, setLikedByMemberId] = useState('')
  const [dislikedByMemberId, setDislikedByMemberId] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Pre-filter raw meals by date range before aggregation
  const dateFilteredMeals = useMemo(() => {
    if (!dateFrom && !dateTo) return meals
    return meals.filter(meal => {
      if (dateFrom && meal.date < dateFrom) return false
      if (dateTo && meal.date > dateTo) return false
      return true
    })
  }, [meals, dateFrom, dateTo])

  // Build unique meals from date-filtered raw meals
  const allUniqueMeals = useMemo(
    () => buildUniqueMeals(dateFilteredMeals, members),
    [dateFilteredMeals, members],
  )

  // Apply search and member filters, then sort
  const filteredMeals = useMemo(() => {
    let result = allUniqueMeals

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(m => m.name.toLowerCase().includes(q))
    }

    if (likedByMemberId) {
      result = result.filter(m => m.likedBy.some(mb => mb.id === likedByMemberId))
    }

    if (dislikedByMemberId) {
      result = result.filter(m => m.dislikedBy.some(mb => mb.id === dislikedByMemberId))
    }

    return sortMeals(result, sortColumn, sortDirection)
  }, [allUniqueMeals, searchQuery, likedByMemberId, dislikedByMemberId, sortColumn, sortDirection])

  const activeFilterCount = [dateFrom, dateTo, likedByMemberId, dislikedByMemberId].filter(Boolean).length

  const handleClearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setLikedByMemberId('')
    setDislikedByMemberId('')
    setSearchQuery('')
  }

  const handleToggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection(column === 'name' ? 'asc' : 'desc')
    }
  }

  const handleExportPdf = async () => {
    if (filteredMeals.length === 0) return
    await exportToPdf(filteredMeals)
  }

  return (
    <div className="px-4 py-6">
      <header className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista posilkow</h1>
          <p className="text-gray-500">
            {filteredMeals.length > 0
              ? `${filteredMeals.length} ${filteredMeals.length !== allUniqueMeals.length ? `z ${allUniqueMeals.length} ` : ''}unikalnych posilkow`
              : 'Przegladaj wszystkie posilki'}
          </p>
        </div>
        {filteredMeals.length > 0 && (
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

      {/* Search */}
      <div className="mb-3">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Szukaj posilku..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Sort + Filter toggle row */}
      <div className="mb-3 flex items-center gap-2">
        {/* Sort controls */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <select
            value={sortColumn}
            onChange={e => {
              const col = e.target.value as SortColumn
              setSortColumn(col)
              setSortDirection(col === 'name' ? 'asc' : 'desc')
            }}
            className="text-sm border border-gray-300 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-0"
          >
            {(Object.keys(SORT_LABELS) as SortColumn[]).map(col => (
              <option key={col} value={col}>
                {SORT_LABELS[col]}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleToggleSort(sortColumn)}
            className="btn-ghost p-2 flex-shrink-0"
            aria-label={sortDirection === 'asc' ? 'Sortuj malejaco' : 'Sortuj rosnaco'}
            title={sortDirection === 'asc' ? 'Rosnaco' : 'Malejaco'}
          >
            {sortDirection === 'asc' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(prev => !prev)}
          className={`btn-ghost flex items-center gap-1 text-sm flex-shrink-0 ${showFilters ? 'bg-primary-50 text-primary-700' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 019 17v-5.586L4.293 6.707A1 1 0 014 6V3z" clipRule="evenodd" />
          </svg>
          Filtry
          {activeFilterCount > 0 && (
            <span className="bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Collapsible filter panel */}
      {showFilters && (
        <div className="card mb-4 space-y-3">
          {/* Date range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zakres dat</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex-1"
                placeholder="Od"
              />
              <span className="text-gray-400 text-sm">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex-1"
                placeholder="Do"
              />
            </div>
          </div>

          {/* Member filters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Polubione przez</label>
              <select
                value={likedByMemberId}
                onChange={e => setLikedByMemberId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Wszyscy</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nie polubione przez</label>
              <select
                value={dislikedByMemberId}
                onChange={e => setDislikedByMemberId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Wszyscy</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Wyczysc wszystkie filtry
            </button>
          )}
        </div>
      )}

      <section>
        {isLoading || membersLoading ? (
          <p className="text-gray-500 text-center py-8">Ladowanie...</p>
        ) : allUniqueMeals.length === 0 && !dateFrom && !dateTo ? (
          <p className="text-gray-500 text-center py-8">
            Brak zapisanych posilkow.
          </p>
        ) : filteredMeals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Brak posilkow pasujacych do filtrow.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredMeals.map((meal) => (
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
                        {meal.likedBy.map(m => m.name).join(', ')}
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
                        {meal.dislikedBy.map(m => m.name).join(', ')}
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
