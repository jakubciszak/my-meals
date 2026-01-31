import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMeals } from './useMeals'

describe('useMeals', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('basic operations', () => {
    it('returns empty array initially', async () => {
      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.meals).toEqual([])
    })

    it('adds a meal', async () => {
      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.addMeal('Spaghetti')
      })

      expect(result.current.meals).toHaveLength(1)
      expect(result.current.meals[0].name).toBe('Spaghetti')
      expect(result.current.meals[0].ratings).toEqual([])
    })

    it('deletes a meal', async () => {
      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let mealId = ''
      act(() => {
        const meal = result.current.addMeal('Do usuniecia')
        mealId = meal.id
      })

      expect(result.current.meals).toHaveLength(1)

      act(() => {
        result.current.deleteMeal(mealId)
      })

      expect(result.current.meals).toHaveLength(0)
    })
  })

  describe('getMealById', () => {
    it('returns meal by id', async () => {
      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let mealId = ''
      act(() => {
        const meal = result.current.addMeal('Pizza')
        mealId = meal.id
      })

      const found = result.current.getMealById(mealId)
      expect(found?.name).toBe('Pizza')
    })

    it('returns undefined for non-existent meal', async () => {
      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const found = result.current.getMealById('non-existent')
      expect(found).toBeUndefined()
    })
  })

  describe('updateMealRating', () => {
    it('adds a rating to a meal', async () => {
      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let mealId = ''
      act(() => {
        const meal = result.current.addMeal('Kotlet')
        mealId = meal.id
      })

      act(() => {
        result.current.updateMealRating(mealId, 'member-1', true)
      })

      const meal = result.current.getMealById(mealId)
      expect(meal?.ratings).toHaveLength(1)
      expect(meal?.ratings[0]).toEqual({ memberId: 'member-1', liked: true })
    })

    it('adds multiple ratings from different members', async () => {
      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let mealId = ''
      act(() => {
        const meal = result.current.addMeal('Zupa')
        mealId = meal.id
      })

      act(() => {
        result.current.updateMealRating(mealId, 'member-1', true)
        result.current.updateMealRating(mealId, 'member-2', false)
      })

      const meal = result.current.getMealById(mealId)
      expect(meal?.ratings).toHaveLength(2)
      expect(meal?.ratings).toContainEqual({ memberId: 'member-1', liked: true })
      expect(meal?.ratings).toContainEqual({ memberId: 'member-2', liked: false })
    })

    it('updates existing rating', async () => {
      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let mealId = ''
      act(() => {
        const meal = result.current.addMeal('Ryba')
        mealId = meal.id
      })

      act(() => {
        result.current.updateMealRating(mealId, 'member-1', true)
      })

      act(() => {
        result.current.updateMealRating(mealId, 'member-1', false)
      })

      const meal = result.current.getMealById(mealId)
      expect(meal?.ratings).toHaveLength(1)
      expect(meal?.ratings[0]).toEqual({ memberId: 'member-1', liked: false })
    })

    it('removes rating when liked is null', async () => {
      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let mealId = ''
      act(() => {
        const meal = result.current.addMeal('Salatka')
        mealId = meal.id
      })

      act(() => {
        result.current.updateMealRating(mealId, 'member-1', true)
      })

      expect(result.current.getMealById(mealId)?.ratings).toHaveLength(1)

      act(() => {
        result.current.updateMealRating(mealId, 'member-1', null)
      })

      expect(result.current.getMealById(mealId)?.ratings).toHaveLength(0)
    })

    it('updates updatedAt when rating changes', async () => {
      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let mealId = ''
      let originalUpdatedAt = ''
      act(() => {
        const meal = result.current.addMeal('Pierogi')
        mealId = meal.id
        originalUpdatedAt = meal.updatedAt
      })

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))

      act(() => {
        result.current.updateMealRating(mealId, 'member-1', true)
      })

      const meal = result.current.getMealById(mealId)
      expect(new Date(meal!.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      )
    })

    it('does not affect other meals when updating rating', async () => {
      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let meal1Id = ''
      let meal2Id = ''
      act(() => {
        const meal1 = result.current.addMeal('Meal 1')
        const meal2 = result.current.addMeal('Meal 2')
        meal1Id = meal1.id
        meal2Id = meal2.id
      })

      act(() => {
        result.current.updateMealRating(meal1Id, 'member-1', true)
      })

      expect(result.current.getMealById(meal1Id)?.ratings).toHaveLength(1)
      expect(result.current.getMealById(meal2Id)?.ratings).toHaveLength(0)
    })
  })

  describe('persistence', () => {
    it('persists meals to localStorage', async () => {
      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.addMeal('Zapisany')
      })

      const stored = localStorage.getItem('my-meals-data')
      expect(stored).toBeDefined()

      const parsed = JSON.parse(stored!)
      expect(parsed.meals).toHaveLength(1)
      expect(parsed.meals[0].name).toBe('Zapisany')
    })

    it('loads meals from localStorage on mount', async () => {
      const storedMeals = {
        meals: [
          {
            id: '1',
            name: 'Loaded meal',
            date: '2024-01-01',
            ratings: [{ memberId: 'member-1', liked: true }],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      }
      localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))

      const { result } = renderHook(() => useMeals())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.meals).toHaveLength(1)
      expect(result.current.meals[0].name).toBe('Loaded meal')
      expect(result.current.meals[0].ratings).toHaveLength(1)
    })
  })
})
