import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Meal } from '../types'

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

  return {
    meals,
    isLoading,
    addMeal,
    deleteMeal,
    getMealsByDate,
    getTodaysMeals,
    getMealsGroupedByDate,
  }
}
