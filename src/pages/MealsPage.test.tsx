import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/test-utils'
import MealsPage from './MealsPage'

describe('MealsPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders page header', async () => {
    render(<MealsPage />)

    expect(screen.getByText('Historia obiadow')).toBeInTheDocument()
    expect(screen.getByText('Przegladaj wczesniejsze posilki')).toBeInTheDocument()
  })

  it('shows empty state when no meals', async () => {
    render(<MealsPage />)

    await waitFor(() => {
      expect(screen.getByText('Brak zapisanych obiadow.')).toBeInTheDocument()
    })
  })

  it('displays meals from localStorage', async () => {
    const today = new Date().toISOString().split('T')[0]
    const storedMeals = {
      meals: [
        {
          id: 'meal-1',
          name: 'Spaghetti',
          date: today,
          ratings: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }
    localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))

    render(<MealsPage />)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti')).toBeInTheDocument()
    })
  })

  it('shows "Dzisiaj" for today\'s meals', async () => {
    const today = new Date().toISOString().split('T')[0]
    const storedMeals = {
      meals: [
        {
          id: 'meal-1',
          name: 'Dzisiejszy obiad',
          date: today,
          ratings: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }
    localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))

    render(<MealsPage />)

    await waitFor(() => {
      expect(screen.getByText('Dzisiaj')).toBeInTheDocument()
    })
  })

  it('shows "Wczoraj" for yesterday\'s meals', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const storedMeals = {
      meals: [
        {
          id: 'meal-1',
          name: 'Wczorajszy obiad',
          date: yesterdayStr,
          ratings: [],
          createdAt: yesterday.toISOString(),
          updatedAt: yesterday.toISOString(),
        },
      ],
    }
    localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))

    render(<MealsPage />)

    await waitFor(() => {
      expect(screen.getByText('Wczoraj')).toBeInTheDocument()
    })
  })

  it('deletes a meal', async () => {
    const today = new Date().toISOString().split('T')[0]
    const storedMeals = {
      meals: [
        {
          id: 'meal-1',
          name: 'DoUsuniecia',
          date: today,
          ratings: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }
    localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))

    render(<MealsPage />)

    await waitFor(() => {
      expect(screen.getByText('DoUsuniecia')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /usun DoUsuniecia/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.queryByText('DoUsuniecia')).not.toBeInTheDocument()
    })
  })

  describe('with family members and ratings', () => {
    beforeEach(() => {
      const storedMembers = {
        members: [
          { id: 'member-1', name: 'Jan', createdAt: '2024-01-01T00:00:00.000Z' },
          { id: 'member-2', name: 'Anna', createdAt: '2024-01-01T00:00:00.000Z' },
        ],
      }
      localStorage.setItem('my-meals-family', JSON.stringify(storedMembers))
    })

    it('displays likes summary', async () => {
      const today = new Date().toISOString().split('T')[0]
      const storedMeals = {
        meals: [
          {
            id: 'meal-1',
            name: 'Pizza',
            date: today,
            ratings: [
              { memberId: 'member-1', liked: true },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }
      localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))

      render(<MealsPage />)

      await waitFor(() => {
        expect(screen.getByText('Pizza')).toBeInTheDocument()
      })

      const likesSummary = screen.getByTestId('likes-summary')
      expect(likesSummary).toBeInTheDocument()
      expect(likesSummary).toHaveTextContent('Jan')
    })

    it('displays dislikes summary', async () => {
      const today = new Date().toISOString().split('T')[0]
      const storedMeals = {
        meals: [
          {
            id: 'meal-1',
            name: 'Brukselka',
            date: today,
            ratings: [
              { memberId: 'member-2', liked: false },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }
      localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))

      render(<MealsPage />)

      await waitFor(() => {
        expect(screen.getByText('Brukselka')).toBeInTheDocument()
      })

      const dislikesSummary = screen.getByTestId('dislikes-summary')
      expect(dislikesSummary).toBeInTheDocument()
      expect(dislikesSummary).toHaveTextContent('Anna')
    })

    it('displays both likes and dislikes', async () => {
      const today = new Date().toISOString().split('T')[0]
      const storedMeals = {
        meals: [
          {
            id: 'meal-1',
            name: 'Schabowy',
            date: today,
            ratings: [
              { memberId: 'member-1', liked: true },
              { memberId: 'member-2', liked: false },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }
      localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))

      render(<MealsPage />)

      await waitFor(() => {
        expect(screen.getByText('Schabowy')).toBeInTheDocument()
      })

      const likesSummary = screen.getByTestId('likes-summary')
      const dislikesSummary = screen.getByTestId('dislikes-summary')

      expect(likesSummary).toHaveTextContent('Jan')
      expect(dislikesSummary).toHaveTextContent('Anna')
    })

    it('displays multiple likes', async () => {
      const today = new Date().toISOString().split('T')[0]
      const storedMeals = {
        meals: [
          {
            id: 'meal-1',
            name: 'Pierogi',
            date: today,
            ratings: [
              { memberId: 'member-1', liked: true },
              { memberId: 'member-2', liked: true },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }
      localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))

      render(<MealsPage />)

      await waitFor(() => {
        expect(screen.getByText('Pierogi')).toBeInTheDocument()
      })

      const likesSummary = screen.getByTestId('likes-summary')
      expect(likesSummary).toHaveTextContent('Jan')
      expect(likesSummary).toHaveTextContent('Anna')
    })

    it('does not show rating summary when no ratings', async () => {
      const today = new Date().toISOString().split('T')[0]
      const storedMeals = {
        meals: [
          {
            id: 'meal-1',
            name: 'BezOceny',
            date: today,
            ratings: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }
      localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))

      render(<MealsPage />)

      await waitFor(() => {
        expect(screen.getByText('BezOceny')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('likes-summary')).not.toBeInTheDocument()
      expect(screen.queryByTestId('dislikes-summary')).not.toBeInTheDocument()
    })

    it('shows "Nieznany" for deleted member', async () => {
      const today = new Date().toISOString().split('T')[0]
      const storedMeals = {
        meals: [
          {
            id: 'meal-1',
            name: 'StaraOcena',
            date: today,
            ratings: [
              { memberId: 'deleted-member', liked: true },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }
      localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))

      render(<MealsPage />)

      await waitFor(() => {
        expect(screen.getByText('StaraOcena')).toBeInTheDocument()
      })

      const likesSummary = screen.getByTestId('likes-summary')
      expect(likesSummary).toHaveTextContent('Nieznany')
    })
  })

  describe('without family members', () => {
    it('does not show rating summary even with ratings data', async () => {
      const today = new Date().toISOString().split('T')[0]
      const storedMeals = {
        meals: [
          {
            id: 'meal-1',
            name: 'TestMeal',
            date: today,
            ratings: [
              { memberId: 'member-1', liked: true },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }
      localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))
      // No family members in storage

      render(<MealsPage />)

      await waitFor(() => {
        expect(screen.getByText('TestMeal')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('likes-summary')).not.toBeInTheDocument()
    })
  })

  describe('CSV export', () => {
    it('does not show export button when no meals', async () => {
      render(<MealsPage />)

      await waitFor(() => {
        expect(screen.getByText('Brak zapisanych obiadow.')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /eksportuj/i })).not.toBeInTheDocument()
    })

    it('shows export button when meals exist', async () => {
      const today = new Date().toISOString().split('T')[0]
      const storedMeals = {
        meals: [
          {
            id: 'meal-1',
            name: 'TestMeal',
            date: today,
            ratings: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }
      localStorage.setItem('my-meals-data', JSON.stringify(storedMeals))

      render(<MealsPage />)

      await waitFor(() => {
        expect(screen.getByText('TestMeal')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /eksportuj/i })).toBeInTheDocument()
    })
  })
})
