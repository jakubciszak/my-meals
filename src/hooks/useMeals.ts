import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Meal, MealRating, FamilyMember } from '../types'

const STORAGE_KEY = 'my-meals-data'

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load meals from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setMeals(data.meals || [])
      } catch {
        console.error('Failed to parse stored meals')
      }
    }
    setIsLoading(false)
  }, [])

  // Save meals to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ meals }))
    }
  }, [meals, isLoading])

  const addMeal = useCallback((name: string, date?: string) => {
    const now = new Date().toISOString()
    const mealDate = date || now.split('T')[0]

    const newMeal: Meal = {
      id: uuidv4(),
      name: name.trim(),
      date: mealDate,
      ratings: [],
      createdAt: now,
      updatedAt: now,
    }

    setMeals(prev => [newMeal, ...prev])
    return newMeal
  }, [])

  const deleteMeal = useCallback((id: string) => {
    setMeals(prev => prev.filter(meal => meal.id !== id))
  }, [])

  const getMealsByDate = useCallback((date: string) => {
    return meals.filter(meal => meal.date === date)
  }, [meals])

  const getTodaysMeals = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return getMealsByDate(today)
  }, [getMealsByDate])

  const getMealsGroupedByDate = useCallback(() => {
    const grouped: Record<string, Meal[]> = {}

    meals.forEach(meal => {
      if (!grouped[meal.date]) {
        grouped[meal.date] = []
      }
      grouped[meal.date].push(meal)
    })

    // Sort dates in descending order
    const sortedDates = Object.keys(grouped).sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    )

    return sortedDates.map(date => ({
      date,
      meals: grouped[date],
    }))
  }, [meals])

  const updateMealRating = useCallback((mealId: string, memberId: string, liked: boolean | null) => {
    setMeals(prev => prev.map(meal => {
      if (meal.id !== mealId) return meal

      const now = new Date().toISOString()
      let newRatings: MealRating[]

      if (liked === null) {
        // Remove rating
        newRatings = meal.ratings.filter(r => r.memberId !== memberId)
      } else {
        const existingRatingIndex = meal.ratings.findIndex(r => r.memberId === memberId)
        if (existingRatingIndex >= 0) {
          // Update existing rating
          newRatings = [...meal.ratings]
          newRatings[existingRatingIndex] = { memberId, liked }
        } else {
          // Add new rating
          newRatings = [...meal.ratings, { memberId, liked }]
        }
      }

      return {
        ...meal,
        ratings: newRatings,
        updatedAt: now,
      }
    }))
  }, [])

  const getMealById = useCallback((id: string) => {
    return meals.find(meal => meal.id === id)
  }, [meals])

  const exportToCSV = useCallback((familyMembers: FamilyMember[]) => {
    if (meals.length === 0) {
      return
    }

    const getMemberName = (memberId: string) => {
      const member = familyMembers.find(m => m.id === memberId)
      return member?.name || 'Nieznany'
    }

    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const headers = ['Data', 'Godzina', 'Nazwa posilku', 'Polubili', 'Nie polubili']
    const rows = meals
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(meal => {
        const date = meal.date
        const time = new Date(meal.createdAt).toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit',
        })
        const likes = meal.ratings
          .filter(r => r.liked)
          .map(r => getMemberName(r.memberId))
          .join(', ')
        const dislikes = meal.ratings
          .filter(r => !r.liked)
          .map(r => getMemberName(r.memberId))
          .join(', ')

        return [date, time, meal.name, likes, dislikes].map(escapeCSV).join(',')
      })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historia-obiadow-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [meals])

  return {
    meals,
    isLoading,
    addMeal,
    deleteMeal,
    getMealsByDate,
    getTodaysMeals,
    getMealsGroupedByDate,
    updateMealRating,
    getMealById,
    exportToCSV,
  }
}
