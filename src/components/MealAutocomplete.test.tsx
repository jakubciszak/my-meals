import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MealAutocomplete } from './MealAutocomplete'

describe('MealAutocomplete', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSelect: vi.fn(),
    suggestions: ['Schabowy', 'Spaghetti', 'Pizza', 'Zupa pomidorowa'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders input with placeholder', () => {
    render(<MealAutocomplete {...defaultProps} />)
    expect(screen.getByPlaceholderText('Co bylo na obiad?')).toBeInTheDocument()
  })

  it('renders input with custom placeholder', () => {
    render(<MealAutocomplete {...defaultProps} placeholder="Wpisz danie" />)
    expect(screen.getByPlaceholderText('Wpisz danie')).toBeInTheDocument()
  })

  it('shows suggestions when typing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MealAutocomplete {...defaultProps} onChange={onChange} value="" />)

    const input = screen.getByRole('combobox')
    await user.type(input, 's')

    expect(onChange).toHaveBeenCalled()
  })

  it('filters suggestions based on input', () => {
    render(<MealAutocomplete {...defaultProps} value="Sch" />)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent('Schabowy')
  })

  it('hides suggestions when input matches exactly', () => {
    render(<MealAutocomplete {...defaultProps} value="Schabowy" />)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    expect(screen.queryByText('Schabowy')).not.toBeInTheDocument()
  })

  it('calls onSelect when suggestion is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<MealAutocomplete {...defaultProps} onSelect={onSelect} value="Sch" />)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    const option = screen.getByRole('option')
    await user.click(option)

    expect(onSelect).toHaveBeenCalledWith('Schabowy')
  })

  it('navigates suggestions with arrow keys', async () => {
    const user = userEvent.setup()
    render(<MealAutocomplete {...defaultProps} value="s" />)

    const input = screen.getByRole('combobox')
    await user.click(input)

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Schabowy')

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Spaghetti')
  })

  it('selects highlighted suggestion with Enter', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<MealAutocomplete {...defaultProps} onSelect={onSelect} value="s" />)

    const input = screen.getByRole('combobox')
    await user.click(input)

    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith('Schabowy')
  })

  it('closes suggestions on Escape', async () => {
    const user = userEvent.setup()
    render(<MealAutocomplete {...defaultProps} value="s" />)

    const input = screen.getByRole('combobox')
    await user.click(input)

    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('calls onKeyDown when no suggestion is highlighted and Enter is pressed', async () => {
    const user = userEvent.setup()
    const onKeyDown = vi.fn()
    render(<MealAutocomplete {...defaultProps} onKeyDown={onKeyDown} value="xyz" />)

    const input = screen.getByRole('combobox')
    await user.type(input, '{Enter}')

    expect(onKeyDown).toHaveBeenCalled()
  })

  it('has correct aria attributes', () => {
    render(<MealAutocomplete {...defaultProps} value="s" />)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveAttribute('aria-haspopup', 'listbox')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
  })

  it('highlights matching text in suggestions', () => {
    render(<MealAutocomplete {...defaultProps} value="Sch" />)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    const suggestion = screen.getByRole('option')
    expect(suggestion.querySelector('.font-semibold')).toHaveTextContent('Sch')
  })

  it('shows no suggestions when input is empty', () => {
    render(<MealAutocomplete {...defaultProps} value="" />)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('is case-insensitive when filtering', () => {
    render(<MealAutocomplete {...defaultProps} value="PIZZA" />)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    // Pizza matches PIZZA (case insensitive) so it should NOT show
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('shows suggestions with partial case-insensitive match', () => {
    render(<MealAutocomplete {...defaultProps} value="piz" />)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    const option = screen.getByRole('option')
    expect(option).toHaveTextContent('Pizza')
  })
})
