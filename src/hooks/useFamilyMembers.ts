import { useState, useEffect, useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { FamilyMember } from '../types'

const STORAGE_KEY = 'my-meals-family'

export function useFamilyMembers() {
  const [allMembers, setAllMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filter out deleted members for public API
  const members = useMemo(() => allMembers.filter(m => !m.deletedAt), [allMembers])

  // Load members from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setAllMembers(data.members || [])
      } catch {
        console.error('Failed to parse stored family members')
      }
    }
    setIsLoading(false)
  }, [])

  // Save all members (including deleted) to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ members: allMembers }))
    }
  }, [allMembers, isLoading])

  const addMember = useCallback((name: string, avatar?: string) => {
    const now = new Date().toISOString()

    const newMember: FamilyMember = {
      id: uuidv4(),
      name: name.trim(),
      avatar,
      createdAt: now,
      updatedAt: now,
    }

    setAllMembers(prev => [...prev, newMember])
    return newMember
  }, [])

  const updateMember = useCallback((id: string, updates: Partial<Omit<FamilyMember, 'id' | 'createdAt'>>) => {
    const now = new Date().toISOString()
    setAllMembers(prev => prev.map(member =>
      member.id === id
        ? { ...member, ...updates, name: updates.name?.trim() || member.name, updatedAt: now }
        : member
    ))
  }, [])

  const deleteMember = useCallback((id: string) => {
    const now = new Date().toISOString()
    setAllMembers(prev => prev.map(member =>
      member.id === id
        ? { ...member, deletedAt: now, updatedAt: now }
        : member
    ))
  }, [])

  const getMemberById = useCallback((id: string) => {
    return members.find(member => member.id === id)
  }, [members])

  return {
    members,
    isLoading,
    addMember,
    updateMember,
    deleteMember,
    getMemberById,
  }
}
