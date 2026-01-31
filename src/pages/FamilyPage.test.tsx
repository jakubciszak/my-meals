import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/test-utils'
import FamilyPage from './FamilyPage'

describe('FamilyPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders page header', async () => {
    render(<FamilyPage />)

    expect(screen.getByText('Rodzina')).toBeInTheDocument()
    expect(screen.getByText('Zarzadzaj czlonkami rodziny')).toBeInTheDocument()
  })

  it('renders add member form', async () => {
    render(<FamilyPage />)

    expect(screen.getByPlaceholderText('Imie')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dodaj czlonka rodziny/i })).toBeInTheDocument()
  })

  it('shows empty state when no members', async () => {
    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.getByText('Brak dodanych czlonkow rodziny.')).toBeInTheDocument()
    })
  })

  it('adds a new family member', async () => {
    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Imie')
    const button = screen.getByRole('button', { name: /dodaj czlonka rodziny/i })

    fireEvent.change(input, { target: { value: 'Jan' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Jan')).toBeInTheDocument()
    })
  })

  it('adds member on Enter key', async () => {
    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Imie')

    fireEvent.change(input, { target: { value: 'Anna' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Anna')).toBeInTheDocument()
    })
  })

  it('clears input after adding member', async () => {
    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Imie') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'Piotr' } })
    fireEvent.click(screen.getByRole('button', { name: /dodaj czlonka rodziny/i }))

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('does not add member with empty name', async () => {
    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const button = screen.getByRole('button', { name: /dodaj czlonka rodziny/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Brak dodanych czlonkow rodziny.')).toBeInTheDocument()
    })
  })

  it('displays member avatar with first letter', async () => {
    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Imie')
    fireEvent.change(input, { target: { value: 'Kasia' } })
    fireEvent.click(screen.getByRole('button', { name: /dodaj czlonka rodziny/i }))

    await waitFor(() => {
      expect(screen.getByText('K')).toBeInTheDocument()
    })
  })

  it('deletes a family member', async () => {
    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Imie')
    fireEvent.change(input, { target: { value: 'DoUsuniecia' } })
    fireEvent.click(screen.getByRole('button', { name: /dodaj czlonka rodziny/i }))

    await waitFor(() => {
      expect(screen.getByText('DoUsuniecia')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /usun DoUsuniecia/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.queryByText('DoUsuniecia')).not.toBeInTheDocument()
    })
  })

  it('starts editing a member', async () => {
    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Imie')
    fireEvent.change(input, { target: { value: 'DoEdycji' } })
    fireEvent.click(screen.getByRole('button', { name: /dodaj czlonka rodziny/i }))

    await waitFor(() => {
      expect(screen.getByText('DoEdycji')).toBeInTheDocument()
    })

    const editButton = screen.getByRole('button', { name: /edytuj DoEdycji/i })
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByLabelText('Edytuj imie')).toBeInTheDocument()
    })
  })

  it('saves edited member name', async () => {
    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Imie')
    fireEvent.change(input, { target: { value: 'StareImie' } })
    fireEvent.click(screen.getByRole('button', { name: /dodaj czlonka rodziny/i }))

    await waitFor(() => {
      expect(screen.getByText('StareImie')).toBeInTheDocument()
    })

    const editButton = screen.getByRole('button', { name: /edytuj StareImie/i })
    fireEvent.click(editButton)

    const editInput = screen.getByLabelText('Edytuj imie')
    fireEvent.change(editInput, { target: { value: 'NoweImie' } })

    const saveButton = screen.getByRole('button', { name: /zapisz/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('NoweImie')).toBeInTheDocument()
      expect(screen.queryByText('StareImie')).not.toBeInTheDocument()
    })
  })

  it('cancels editing on Escape key', async () => {
    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Imie')
    fireEvent.change(input, { target: { value: 'Testowy' } })
    fireEvent.click(screen.getByRole('button', { name: /dodaj czlonka rodziny/i }))

    await waitFor(() => {
      expect(screen.getByText('Testowy')).toBeInTheDocument()
    })

    const editButton = screen.getByRole('button', { name: /edytuj Testowy/i })
    fireEvent.click(editButton)

    const editInput = screen.getByLabelText('Edytuj imie')
    fireEvent.change(editInput, { target: { value: 'Zmieniony' } })
    fireEvent.keyDown(editInput, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.getByText('Testowy')).toBeInTheDocument()
      expect(screen.queryByLabelText('Edytuj imie')).not.toBeInTheDocument()
    })
  })

  it('cancels editing on cancel button click', async () => {
    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Imie')
    fireEvent.change(input, { target: { value: 'Anulowany' } })
    fireEvent.click(screen.getByRole('button', { name: /dodaj czlonka rodziny/i }))

    await waitFor(() => {
      expect(screen.getByText('Anulowany')).toBeInTheDocument()
    })

    const editButton = screen.getByRole('button', { name: /edytuj Anulowany/i })
    fireEvent.click(editButton)

    const cancelButton = screen.getByRole('button', { name: /anuluj/i })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByLabelText('Edytuj imie')).not.toBeInTheDocument()
    })
  })

  it('saves edit on Enter key', async () => {
    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.queryByText('Ladowanie...')).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Imie')
    fireEvent.change(input, { target: { value: 'Enter' } })
    fireEvent.click(screen.getByRole('button', { name: /dodaj czlonka rodziny/i }))

    await waitFor(() => {
      expect(screen.getByText('Enter')).toBeInTheDocument()
    })

    const editButton = screen.getByRole('button', { name: /edytuj Enter/i })
    fireEvent.click(editButton)

    const editInput = screen.getByLabelText('Edytuj imie')
    fireEvent.change(editInput, { target: { value: 'EnterZmieniony' } })
    fireEvent.keyDown(editInput, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('EnterZmieniony')).toBeInTheDocument()
    })
  })

  it('loads members from localStorage', async () => {
    const storedMembers = {
      members: [
        { id: '1', name: 'Zapisany', createdAt: '2024-01-01T00:00:00.000Z' },
      ],
    }
    localStorage.setItem('my-meals-family', JSON.stringify(storedMembers))

    render(<FamilyPage />)

    await waitFor(() => {
      expect(screen.getByText('Zapisany')).toBeInTheDocument()
    })
  })
})
