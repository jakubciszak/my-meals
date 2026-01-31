import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/test-utils'
import HomePage from './HomePage'

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders page header', async () => {
    render(<HomePage />)

    expect(screen.getByText('Dzisiejsze obiady')).toBeInTheDocument()
  })

  it('renders add meal form', async () => {
    render(<HomePage />)

    expect(screen.getByPlaceholderText('Co bylo na obiad?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dodaj obiad/i })).toBeInTheDocument()
  })

  it('shows empty state when no meals', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Brak obiadow na dzis. Dodaj pierwszy!')).toBeInTheDocument()
    })
  })

  it('adds a new meal', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Co bylo na obiad?')
    const button = screen.getByRole('button', { name: /dodaj obiad/i })

    fireEvent.change(input, { target: { value: 'Spaghetti' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Spaghetti')).toBeInTheDocument()
    })
  })

  it('adds meal on Enter key', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Co bylo na obiad?')

    fireEvent.change(input, { target: { value: 'Pizza' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument()
    })
  })

  it('clears input after adding meal', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Co bylo na obiad?') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'Kotlet' } })
    fireEvent.click(screen.getByRole('button', { name: /dodaj obiad/i }))

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('does not add meal with empty name', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const button = screen.getByRole('button', { name: /dodaj obiad/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Brak obiadow na dzis. Dodaj pierwszy!')).toBeInTheDocument()
    })
  })

  it('deletes a meal', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Co bylo na obiad?')
    fireEvent.change(input, { target: { value: 'DoUsuniecia' } })
    fireEvent.click(screen.getByRole('button', { name: /dodaj obiad/i }))

    await waitFor(() => {
      expect(screen.getByText('DoUsuniecia')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /usun DoUsuniecia/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.queryByText('DoUsuniecia')).not.toBeInTheDocument()
    })
  })

  describe('with family members', () => {
    beforeEach(() => {
      const storedMembers = {
        members: [
          { id: 'member-1', name: 'Jan', createdAt: '2024-01-01T00:00:00.000Z' },
          { id: 'member-2', name: 'Anna', createdAt: '2024-01-01T00:00:00.000Z' },
        ],
      }
      localStorage.setItem('my-meals-family', JSON.stringify(storedMembers))
    })

    it('shows rating buttons when family members exist', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Co bylo na obiad?')
      fireEvent.change(input, { target: { value: 'Zupa' } })
      fireEvent.click(screen.getByRole('button', { name: /dodaj obiad/i }))

      await waitFor(() => {
        expect(screen.getByText('Zupa')).toBeInTheDocument()
      })

      expect(screen.getByText('Oceny:')).toBeInTheDocument()
      expect(screen.getByText('Jan')).toBeInTheDocument()
      expect(screen.getByText('Anna')).toBeInTheDocument()
    })

    it('shows like button for each family member', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Co bylo na obiad?')
      fireEvent.change(input, { target: { value: 'Pierogi' } })
      fireEvent.click(screen.getByRole('button', { name: /dodaj obiad/i }))

      await waitFor(() => {
        expect(screen.getByText('Pierogi')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /Jan lubi Pierogi/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Anna lubi Pierogi/i })).toBeInTheDocument()
    })

    it('shows dislike button for each family member', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Co bylo na obiad?')
      fireEvent.change(input, { target: { value: 'Ryba' } })
      fireEvent.click(screen.getByRole('button', { name: /dodaj obiad/i }))

      await waitFor(() => {
        expect(screen.getByText('Ryba')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /Jan nie lubi Ryba/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Anna nie lubi Ryba/i })).toBeInTheDocument()
    })

    it('toggles like rating', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Co bylo na obiad?')
      fireEvent.change(input, { target: { value: 'Salatka' } })
      fireEvent.click(screen.getByRole('button', { name: /dodaj obiad/i }))

      await waitFor(() => {
        expect(screen.getByText('Salatka')).toBeInTheDocument()
      })

      const likeButton = screen.getByRole('button', { name: /Jan lubi Salatka/i })
      fireEvent.click(likeButton)

      // Button should now have green background (visual change)
      expect(likeButton).toHaveClass('bg-green-500')
    })

    it('toggles dislike rating', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Co bylo na obiad?')
      fireEvent.change(input, { target: { value: 'Groch' } })
      fireEvent.click(screen.getByRole('button', { name: /dodaj obiad/i }))

      await waitFor(() => {
        expect(screen.getByText('Groch')).toBeInTheDocument()
      })

      const dislikeButton = screen.getByRole('button', { name: /Anna nie lubi Groch/i })
      fireEvent.click(dislikeButton)

      // Button should now have red background
      expect(dislikeButton).toHaveClass('bg-red-500')
    })

    it('removes rating when clicking same button again', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Co bylo na obiad?')
      fireEvent.change(input, { target: { value: 'Kurczak' } })
      fireEvent.click(screen.getByRole('button', { name: /dodaj obiad/i }))

      await waitFor(() => {
        expect(screen.getByText('Kurczak')).toBeInTheDocument()
      })

      const likeButton = screen.getByRole('button', { name: /Jan lubi Kurczak/i })

      // Click to like
      fireEvent.click(likeButton)
      expect(likeButton).toHaveClass('bg-green-500')

      // Click again to remove rating
      fireEvent.click(likeButton)
      expect(likeButton).not.toHaveClass('bg-green-500')
      expect(likeButton).toHaveClass('bg-gray-100')
    })

    it('switches from like to dislike', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Co bylo na obiad?')
      fireEvent.change(input, { target: { value: 'Schabowy' } })
      fireEvent.click(screen.getByRole('button', { name: /dodaj obiad/i }))

      await waitFor(() => {
        expect(screen.getByText('Schabowy')).toBeInTheDocument()
      })

      const likeButton = screen.getByRole('button', { name: /Jan lubi Schabowy/i })
      const dislikeButton = screen.getByRole('button', { name: /Jan nie lubi Schabowy/i })

      // Click like
      fireEvent.click(likeButton)
      expect(likeButton).toHaveClass('bg-green-500')

      // Click dislike - should switch
      fireEvent.click(dislikeButton)
      expect(dislikeButton).toHaveClass('bg-red-500')
      expect(likeButton).not.toHaveClass('bg-green-500')
    })

    it('displays member avatar initials', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Co bylo na obiad?')
      fireEvent.change(input, { target: { value: 'Makaron' } })
      fireEvent.click(screen.getByRole('button', { name: /dodaj obiad/i }))

      await waitFor(() => {
        expect(screen.getByText('Makaron')).toBeInTheDocument()
      })

      // Check for avatar initials
      expect(screen.getByText('J')).toBeInTheDocument() // Jan
      expect(screen.getByText('A')).toBeInTheDocument() // Anna
    })
  })

  describe('without family members', () => {
    it('does not show rating section when no family members', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('Co bylo na obiad?')
      fireEvent.change(input, { target: { value: 'Bigos' } })
      fireEvent.click(screen.getByRole('button', { name: /dodaj obiad/i }))

      await waitFor(() => {
        expect(screen.getByText('Bigos')).toBeInTheDocument()
      })

      expect(screen.queryByText('Oceny:')).not.toBeInTheDocument()
    })
  })
})
