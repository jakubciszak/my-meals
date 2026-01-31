import { describe, it, expect } from 'vitest'
import { render, screen } from './test/test-utils'
import App from './App'

describe('App', () => {
  it('renders home page by default', () => {
    render(<App />)
    expect(screen.getByText('Dzisiejsze obiady')).toBeInTheDocument()
  })

  it('renders navigation with all links', () => {
    render(<App />)
    expect(screen.getByText('Dziś')).toBeInTheDocument()
    expect(screen.getByText('Historia')).toBeInTheDocument()
    expect(screen.getByText('Rodzina')).toBeInTheDocument()
    expect(screen.getByText('Ustawienia')).toBeInTheDocument()
  })

  it('renders meal input field', () => {
    render(<App />)
    expect(screen.getByPlaceholderText('Co było na obiad?')).toBeInTheDocument()
  })

  it('renders add meal button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /dodaj obiad/i })).toBeInTheDocument()
  })
})
