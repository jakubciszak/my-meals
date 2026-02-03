import { useState, useCallback, useEffect, useRef } from 'react'
import type { Meal, FamilyMember } from '../types'

const SCOPES = 'https://www.googleapis.com/auth/drive.file'

const MEALS_FILE_NAME = 'my-meals-data.csv'
const FAMILY_FILE_NAME = 'my-meals-family.csv'

const ACCESS_TOKEN_KEY = 'my-meals-google-token'
const TOKEN_EXPIRY_KEY = 'my-meals-google-token-expiry'
const LAST_SYNC_KEY = 'my-meals-last-sync'

const MEALS_STORAGE_KEY = 'my-meals-data'
const FAMILY_STORAGE_KEY = 'my-meals-family'

interface UseGoogleDriveOptions {
  onDataImported?: () => void
}

export function useGoogleDrive(options?: UseGoogleDriveOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null)
  const accessTokenRef = useRef<string | null>(null)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  // Check for existing valid token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY)

    if (storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10)
      if (Date.now() < expiryTime) {
        accessTokenRef.current = storedToken
        setIsConnected(true)
      } else {
        // Token expired, clear it
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(TOKEN_EXPIRY_KEY)
      }
    }

    const storedLastSync = localStorage.getItem(LAST_SYNC_KEY)
    if (storedLastSync) {
      setLastSyncedAt(storedLastSync)
    }
  }, [])

  // Initialize token client
  useEffect(() => {
    if (!clientId) {
      return
    }

    const initializeGis = () => {
      if (!window.google?.accounts?.oauth2) {
        // Google Identity Services not loaded yet, retry
        setTimeout(initializeGis, 100)
        return
      }

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            setError(response.error_description || 'Błąd autoryzacji')
            setIsLoading(false)
            return
          }

          accessTokenRef.current = response.access_token
          const expiryTime = Date.now() + (response.expires_in * 1000)

          localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token)
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())

          setIsConnected(true)
          setIsLoading(false)
          setError(null)
        },
        error_callback: (err) => {
          setError(err.message || 'Błąd połączenia z Google')
          setIsLoading(false)
        }
      })
    }

    initializeGis()
  }, [clientId])

  const connect = useCallback(() => {
    if (!tokenClientRef.current) {
      setError('Google Identity Services nie jest załadowane')
      return
    }

    setIsLoading(true)
    setError(null)
    tokenClientRef.current.requestAccessToken({ prompt: 'consent' })
  }, [])

  const disconnect = useCallback(() => {
    if (accessTokenRef.current) {
      window.google?.accounts.oauth2.revoke(accessTokenRef.current, () => {
        accessTokenRef.current = null
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(TOKEN_EXPIRY_KEY)
        setIsConnected(false)
        setLastSyncedAt(null)
        localStorage.removeItem(LAST_SYNC_KEY)
      })
    }
  }, [])

  // Helper to make authenticated requests
  const fetchWithAuth = useCallback(async (url: string, fetchOptions?: RequestInit) => {
    if (!accessTokenRef.current) {
      throw new Error('Nie jesteś połączony z Google Drive')
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...fetchOptions?.headers,
        'Authorization': `Bearer ${accessTokenRef.current}`,
      },
    })

    if (response.status === 401) {
      // Token expired
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(TOKEN_EXPIRY_KEY)
      setIsConnected(false)
      throw new Error('Sesja wygasła. Połącz się ponownie.')
    }

    return response
  }, [])

  // Find file by name in Google Drive
  const findFile = useCallback(async (fileName: string): Promise<string | null> => {
    const response = await fetchWithAuth(
      `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false&spaces=drive&fields=files(id,name)`
    )

    const data = await response.json()
    return data.files?.[0]?.id || null
  }, [fetchWithAuth])

  // Upload/update file
  const uploadFile = useCallback(async (fileName: string, content: string, existingFileId?: string | null) => {
    const metadata = {
      name: fileName,
      mimeType: 'text/csv',
    }

    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', new Blob([content], { type: 'text/csv' }))

    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
    let method = 'POST'

    if (existingFileId) {
      url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
      method = 'PATCH'
    }

    const response = await fetchWithAuth(url, {
      method,
      body: form,
    })

    if (!response.ok) {
      throw new Error('Błąd podczas zapisywania pliku')
    }

    return response.json()
  }, [fetchWithAuth])

  // Download file content
  const downloadFile = useCallback(async (fileId: string): Promise<string> => {
    const response = await fetchWithAuth(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
    )

    if (!response.ok) {
      throw new Error('Błąd podczas pobierania pliku')
    }

    return response.text()
  }, [fetchWithAuth])

  // Convert meals to CSV
  const mealsToCSV = useCallback((meals: Meal[]): string => {
    const headers = ['id', 'name', 'date', 'ratings', 'ingredients', 'notes', 'createdAt', 'updatedAt']

    const rows = meals.map(meal => {
      const ratingsJson = JSON.stringify(meal.ratings)
      const ingredientsJson = meal.ingredients ? JSON.stringify(meal.ingredients) : ''

      return [
        meal.id,
        escapeCSVField(meal.name),
        meal.date,
        escapeCSVField(ratingsJson),
        escapeCSVField(ingredientsJson),
        escapeCSVField(meal.notes || ''),
        meal.createdAt,
        meal.updatedAt,
      ].join(',')
    })

    return [headers.join(','), ...rows].join('\n')
  }, [])

  // Convert family members to CSV
  const familyToCSV = useCallback((members: FamilyMember[]): string => {
    const headers = ['id', 'name', 'avatar', 'createdAt']

    const rows = members.map(member => [
      member.id,
      escapeCSVField(member.name),
      escapeCSVField(member.avatar || ''),
      member.createdAt,
    ].join(','))

    return [headers.join(','), ...rows].join('\n')
  }, [])

  // Parse CSV to meals
  const csvToMeals = useCallback((csv: string): Meal[] => {
    const lines = csv.split('\n')
    if (lines.length < 2) return []

    const meals: Meal[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const fields = parseCSVLine(line)
      if (fields.length < 8) continue

      try {
        meals.push({
          id: fields[0],
          name: fields[1],
          date: fields[2],
          ratings: fields[3] ? JSON.parse(fields[3]) : [],
          ingredients: fields[4] ? JSON.parse(fields[4]) : undefined,
          notes: fields[5] || undefined,
          createdAt: fields[6],
          updatedAt: fields[7],
        })
      } catch {
        console.error('Failed to parse meal row:', line)
      }
    }

    return meals
  }, [])

  // Parse CSV to family members
  const csvToFamily = useCallback((csv: string): FamilyMember[] => {
    const lines = csv.split('\n')
    if (lines.length < 2) return []

    const members: FamilyMember[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const fields = parseCSVLine(line)
      if (fields.length < 4) continue

      members.push({
        id: fields[0],
        name: fields[1],
        avatar: fields[2] || undefined,
        createdAt: fields[3],
      })
    }

    return members
  }, [])

  // Get local data from localStorage
  const getLocalData = useCallback((): { meals: Meal[], familyMembers: FamilyMember[] } => {
    let meals: Meal[] = []
    let familyMembers: FamilyMember[] = []

    const storedMeals = localStorage.getItem(MEALS_STORAGE_KEY)
    if (storedMeals) {
      try {
        const data = JSON.parse(storedMeals)
        meals = data.meals || []
      } catch {
        console.error('Failed to parse stored meals')
      }
    }

    const storedFamily = localStorage.getItem(FAMILY_STORAGE_KEY)
    if (storedFamily) {
      try {
        const data = JSON.parse(storedFamily)
        familyMembers = data.members || []
      } catch {
        console.error('Failed to parse stored family members')
      }
    }

    return { meals, familyMembers }
  }, [])

  // Save data to localStorage
  const saveLocalData = useCallback((meals: Meal[], familyMembers: FamilyMember[]) => {
    localStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify({ meals }))
    localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify({ members: familyMembers }))
  }, [])

  // Sync local data to Google Drive
  const syncToCloud = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Nie jesteś połączony z Google Drive')
    }

    setIsSyncing(true)
    setError(null)

    try {
      const { meals, familyMembers } = getLocalData()

      // Find existing files
      const [mealsFileId, familyFileId] = await Promise.all([
        findFile(MEALS_FILE_NAME),
        findFile(FAMILY_FILE_NAME),
      ])

      // Upload/update files
      const mealsCSV = mealsToCSV(meals)
      const familyCSV = familyToCSV(familyMembers)

      await Promise.all([
        uploadFile(MEALS_FILE_NAME, mealsCSV, mealsFileId),
        uploadFile(FAMILY_FILE_NAME, familyCSV, familyFileId),
      ])

      const now = new Date().toISOString()
      setLastSyncedAt(now)
      localStorage.setItem(LAST_SYNC_KEY, now)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Błąd synchronizacji'
      setError(message)
      throw err
    } finally {
      setIsSyncing(false)
    }
  }, [isConnected, getLocalData, findFile, mealsToCSV, familyToCSV, uploadFile])

  // Sync data from Google Drive to local
  const syncFromCloud = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      throw new Error('Nie jesteś połączony z Google Drive')
    }

    setIsSyncing(true)
    setError(null)

    try {
      // Find existing files
      const [mealsFileId, familyFileId] = await Promise.all([
        findFile(MEALS_FILE_NAME),
        findFile(FAMILY_FILE_NAME),
      ])

      if (!mealsFileId && !familyFileId) {
        setIsSyncing(false)
        return false // No data in cloud
      }

      const [mealsCSV, familyCSV] = await Promise.all([
        mealsFileId ? downloadFile(mealsFileId) : Promise.resolve(''),
        familyFileId ? downloadFile(familyFileId) : Promise.resolve(''),
      ])

      const meals = mealsCSV ? csvToMeals(mealsCSV) : []
      const familyMembers = familyCSV ? csvToFamily(familyCSV) : []

      // Save to localStorage
      saveLocalData(meals, familyMembers)

      const now = new Date().toISOString()
      setLastSyncedAt(now)
      localStorage.setItem(LAST_SYNC_KEY, now)

      // Notify that data was imported (triggers page reload)
      options?.onDataImported?.()

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Błąd pobierania danych'
      setError(message)
      throw err
    } finally {
      setIsSyncing(false)
    }
  }, [isConnected, findFile, downloadFile, csvToMeals, csvToFamily, saveLocalData, options])

  const isConfigured = Boolean(clientId)

  return {
    isConnected,
    isLoading,
    isSyncing,
    lastSyncedAt,
    error,
    isConfigured,
    connect,
    disconnect,
    syncToCloud,
    syncFromCloud,
  }
}

// Helper functions
function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        fields.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }

  fields.push(current)
  return fields
}
