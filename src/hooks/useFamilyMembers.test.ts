import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFamilyMembers } from './useFamilyMembers'

describe('useFamilyMembers', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('returns empty array initially', async () => {
    const { result } = renderHook(() => useFamilyMembers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.members).toEqual([])
  })

  it('loads members from localStorage on mount', async () => {
    const storedMembers = {
      members: [
        { id: '1', name: 'Jan', createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', name: 'Anna', createdAt: '2024-01-01T00:00:00.000Z' },
      ],
    }
    localStorage.setItem('my-meals-family', JSON.stringify(storedMembers))

    const { result } = renderHook(() => useFamilyMembers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.members).toHaveLength(2)
    expect(result.current.members[0].name).toBe('Jan')
    expect(result.current.members[1].name).toBe('Anna')
  })

  it('adds a new member', async () => {
    const { result } = renderHook(() => useFamilyMembers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.addMember('Tomek')
    })

    expect(result.current.members).toHaveLength(1)
    expect(result.current.members[0].name).toBe('Tomek')
    expect(result.current.members[0].id).toBeDefined()
    expect(result.current.members[0].createdAt).toBeDefined()
  })

  it('adds a member with avatar', async () => {
    const { result } = renderHook(() => useFamilyMembers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.addMember('Kasia', 'avatar-url.jpg')
    })

    expect(result.current.members[0].avatar).toBe('avatar-url.jpg')
  })

  it('trims member name when adding', async () => {
    const { result } = renderHook(() => useFamilyMembers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.addMember('  Piotr  ')
    })

    expect(result.current.members[0].name).toBe('Piotr')
  })

  it('updates a member', async () => {
    const { result } = renderHook(() => useFamilyMembers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let memberId = ''
    act(() => {
      const member = result.current.addMember('Stare imie')
      memberId = member.id
    })

    act(() => {
      result.current.updateMember(memberId, { name: 'Nowe imie' })
    })

    expect(result.current.members[0].name).toBe('Nowe imie')
  })

  it('updates member avatar', async () => {
    const { result } = renderHook(() => useFamilyMembers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let memberId = ''
    act(() => {
      const member = result.current.addMember('Jan')
      memberId = member.id
    })

    act(() => {
      result.current.updateMember(memberId, { avatar: 'new-avatar.jpg' })
    })

    expect(result.current.members[0].avatar).toBe('new-avatar.jpg')
  })

  it('deletes a member', async () => {
    const { result } = renderHook(() => useFamilyMembers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let memberId = ''
    act(() => {
      const member = result.current.addMember('Do usuniecia')
      memberId = member.id
    })

    expect(result.current.members).toHaveLength(1)

    act(() => {
      result.current.deleteMember(memberId)
    })

    expect(result.current.members).toHaveLength(0)
  })

  it('gets member by id', async () => {
    const { result } = renderHook(() => useFamilyMembers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let memberId = ''
    act(() => {
      const member = result.current.addMember('Szukany')
      memberId = member.id
    })

    const found = result.current.getMemberById(memberId)
    expect(found?.name).toBe('Szukany')
  })

  it('returns undefined for non-existent member id', async () => {
    const { result } = renderHook(() => useFamilyMembers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const found = result.current.getMemberById('non-existent-id')
    expect(found).toBeUndefined()
  })

  it('persists members to localStorage', async () => {
    const { result } = renderHook(() => useFamilyMembers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.addMember('Zapisany')
    })

    const stored = localStorage.getItem('my-meals-family')
    expect(stored).toBeDefined()

    const parsed = JSON.parse(stored!)
    expect(parsed.members).toHaveLength(1)
    expect(parsed.members[0].name).toBe('Zapisany')
  })

  it('handles corrupted localStorage data gracefully', async () => {
    localStorage.setItem('my-meals-family', 'invalid-json')

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useFamilyMembers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.members).toEqual([])
    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse stored family members')

    consoleSpy.mockRestore()
  })
})
