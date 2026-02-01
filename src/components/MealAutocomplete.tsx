import { useState, useRef, useEffect } from 'react'

interface MealAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (value: string) => void
  suggestions: string[]
  placeholder?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  'aria-label'?: string
}

export function MealAutocomplete({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder = 'Co bylo na obiad?',
  onKeyDown,
  'aria-label': ariaLabel = 'Nazwa obiadu',
}: MealAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Filter suggestions based on input
  const filteredSuggestions = value.trim().length > 0
    ? suggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase()) &&
        s.toLowerCase() !== value.toLowerCase()
      )
    : []

  const showSuggestions = isOpen && filteredSuggestions.length > 0

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [value])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement
      if (item) {
        item.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setIsOpen(true)
  }

  const handleSelect = (suggestion: string) => {
    onSelect(suggestion)
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      onKeyDown?.(e)
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        if (highlightedIndex >= 0) {
          e.preventDefault()
          handleSelect(filteredSuggestions[highlightedIndex])
        } else {
          onKeyDown?.(e)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      case 'Tab':
        setIsOpen(false)
        break
      default:
        onKeyDown?.(e)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay hiding to allow click on suggestions
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.closest('[data-autocomplete-list]')) {
      return
    }
    setTimeout(() => setIsOpen(false), 150)
  }

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="input w-full"
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={showSuggestions}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls={showSuggestions ? 'meal-suggestions' : undefined}
        aria-activedescendant={
          highlightedIndex >= 0 ? `meal-suggestion-${highlightedIndex}` : undefined
        }
      />
      {showSuggestions && (
        <ul
          ref={listRef}
          id="meal-suggestions"
          data-autocomplete-list
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`meal-suggestion-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              className={`px-4 py-2 cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <HighlightedText text={suggestion} query={value} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Helper component to highlight matching text
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const startIndex = lowerText.indexOf(lowerQuery)

  if (startIndex === -1) return <>{text}</>

  const before = text.slice(0, startIndex)
  const match = text.slice(startIndex, startIndex + query.length)
  const after = text.slice(startIndex + query.length)

  return (
    <>
      {before}
      <span className="font-semibold text-primary">{match}</span>
      {after}
    </>
  )
}
