import { useState, useCallback, useEffect, useRef } from 'react'
import type { Meal, FamilyMember } from '../types'

// Need both scopes: spreadsheets for read/write, drive.readonly to list files
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly'

// Custom event name for data changes
export const DATA_CHANGED_EVENT = 'my-meals-data-changed'

// Debounce delay for auto-sync (in ms)
const AUTO_SYNC_DEBOUNCE = 2000

export interface SpreadsheetInfo {
  id: string
  name: string
}

const ACCESS_TOKEN_KEY = 'my-meals-sheets-token'
const TOKEN_EXPIRY_KEY = 'my-meals-sheets-token-expiry'
const LAST_SYNC_KEY = 'my-meals-sheets-last-sync'
const SPREADSHEET_ID_KEY = 'my-meals-sheets-spreadsheet-id'

const MEALS_STORAGE_KEY = 'my-meals-data'
const FAMILY_STORAGE_KEY = 'my-meals-family'

const MEALS_SHEET_NAME = 'Meals'
const FAMILY_SHEET_NAME = 'Family'

interface UseGoogleSheetsOptions {
  onDataImported?: () => void
}

export function useGoogleSheets(options?: UseGoogleSheetsOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null)
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetInfo[]>([])
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState(false)

  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null)
  const accessTokenRef = useRef<string | null>(null)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  // Check for existing valid token and spreadsheet ID on mount
  useEffect(() => {
    const storedSpreadsheetId = localStorage.getItem(SPREADSHEET_ID_KEY)
    if (storedSpreadsheetId) {
      setSpreadsheetId(storedSpreadsheetId)
    }

    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY)

    if (storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10)
      if (Date.now() < expiryTime) {
        accessTokenRef.current = storedToken
        setIsConnected(true)
      } else {
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

  const updateSpreadsheetId = useCallback((id: string | null) => {
    setSpreadsheetId(id)
    if (id) {
      localStorage.setItem(SPREADSHEET_ID_KEY, id)
    } else {
      localStorage.removeItem(SPREADSHEET_ID_KEY)
    }
  }, [])

  // List user's Google Spreadsheets
  const listSpreadsheets = useCallback(async () => {
    if (!accessTokenRef.current) {
      return
    }

    setIsLoadingSpreadsheets(true)
    setError(null)

    try {
      const response = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&orderBy=modifiedTime desc&pageSize=50&fields=files(id,name)",
        {
          headers: {
            'Authorization': `Bearer ${accessTokenRef.current}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Nie udało się pobrać listy arkuszy')
      }

      const data = await response.json()
      const files: SpreadsheetInfo[] = (data.files || []).map((f: { id: string; name: string }) => ({
        id: f.id,
        name: f.name,
      }))

      setSpreadsheets(files)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Błąd pobierania listy arkuszy'
      setError(message)
    } finally {
      setIsLoadingSpreadsheets(false)
    }
  }, [])

  // Create new spreadsheet
  const createSpreadsheet = useCallback(async (name: string): Promise<string | null> => {
    if (!accessTokenRef.current) {
      setError('Nie jesteś połączony z Google Sheets')
      return null
    }

    setIsLoadingSpreadsheets(true)
    setError(null)

    try {
      const response = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessTokenRef.current}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: { title: name },
            sheets: [
              { properties: { title: MEALS_SHEET_NAME } },
              { properties: { title: FAMILY_SHEET_NAME } },
            ],
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Nie udało się utworzyć arkusza')
      }

      const data = await response.json()
      const newId = data.spreadsheetId

      // Refresh list and select new spreadsheet
      await listSpreadsheets()
      updateSpreadsheetId(newId)

      return newId
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Błąd tworzenia arkusza'
      setError(message)
      return null
    } finally {
      setIsLoadingSpreadsheets(false)
    }
  }, [listSpreadsheets, updateSpreadsheetId])

  // Helper to make authenticated requests
  const fetchWithAuth = useCallback(async (url: string, fetchOptions?: RequestInit) => {
    if (!accessTokenRef.current) {
      throw new Error('Nie jesteś połączony z Google Sheets')
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...fetchOptions?.headers,
        'Authorization': `Bearer ${accessTokenRef.current}`,
      },
    })

    if (response.status === 401) {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(TOKEN_EXPIRY_KEY)
      setIsConnected(false)
      throw new Error('Sesja wygasła. Połącz się ponownie.')
    }

    return response
  }, [])

  // Check if sheet exists, create if not
  const ensureSheetExists = useCallback(async (sheetName: string) => {
    if (!spreadsheetId) throw new Error('Nie podano ID arkusza')

    // Get spreadsheet metadata
    const response = await fetchWithAuth(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`
    )

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Nie znaleziono arkusza. Sprawdź ID arkusza.')
      }
      throw new Error('Błąd podczas sprawdzania arkusza')
    }

    const data = await response.json()
    const sheets = data.sheets || []
    const sheetExists = sheets.some(
      (s: { properties: { title: string } }) => s.properties.title === sheetName
    )

    if (!sheetExists) {
      // Create new sheet
      const addSheetResponse = await fetchWithAuth(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              addSheet: {
                properties: { title: sheetName }
              }
            }]
          })
        }
      )

      if (!addSheetResponse.ok) {
        throw new Error(`Błąd podczas tworzenia arkusza ${sheetName}`)
      }
    }
  }, [spreadsheetId, fetchWithAuth])

  // Read data from sheet
  const readSheet = useCallback(async (sheetName: string): Promise<string[][]> => {
    if (!spreadsheetId) throw new Error('Nie podano ID arkusza')

    const response = await fetchWithAuth(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:Z`
    )

    if (!response.ok) {
      if (response.status === 400) {
        // Sheet doesn't exist or is empty
        return []
      }
      throw new Error(`Błąd podczas odczytu arkusza ${sheetName}`)
    }

    const data = await response.json()
    return data.values || []
  }, [spreadsheetId, fetchWithAuth])

  // Write data to sheet (clear and write)
  const writeSheet = useCallback(async (sheetName: string, data: string[][]) => {
    if (!spreadsheetId) throw new Error('Nie podano ID arkusza')

    await ensureSheetExists(sheetName)

    // Clear existing data
    await fetchWithAuth(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:Z:clear`,
      { method: 'POST' }
    )

    if (data.length === 0) return

    // Write new data
    const response = await fetchWithAuth(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: data })
      }
    )

    if (!response.ok) {
      throw new Error(`Błąd podczas zapisywania do arkusza ${sheetName}`)
    }
  }, [spreadsheetId, ensureSheetExists, fetchWithAuth])

  // Convert meals to 2D array
  const mealsToRows = useCallback((meals: Meal[]): string[][] => {
    const headers = ['id', 'name', 'date', 'ratings', 'ingredients', 'notes', 'createdAt', 'updatedAt', 'deletedAt']

    const rows = meals.map(meal => [
      meal.id,
      meal.name,
      meal.date,
      JSON.stringify(meal.ratings),
      meal.ingredients ? JSON.stringify(meal.ingredients) : '',
      meal.notes || '',
      meal.createdAt,
      meal.updatedAt,
      meal.deletedAt || '',
    ])

    return [headers, ...rows]
  }, [])

  // Convert family members to 2D array
  const familyToRows = useCallback((members: FamilyMember[]): string[][] => {
    const headers = ['id', 'name', 'avatar', 'createdAt', 'updatedAt', 'deletedAt']

    const rows = members.map(member => [
      member.id,
      member.name,
      member.avatar || '',
      member.createdAt,
      member.updatedAt || member.createdAt,
      member.deletedAt || '',
    ])

    return [headers, ...rows]
  }, [])

  // Parse rows to meals
  const rowsToMeals = useCallback((rows: string[][]): Meal[] => {
    if (rows.length < 2) return []

    const meals: Meal[] = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length < 8) continue

      try {
        meals.push({
          id: row[0],
          name: row[1],
          date: row[2],
          ratings: row[3] ? JSON.parse(row[3]) : [],
          ingredients: row[4] ? JSON.parse(row[4]) : undefined,
          notes: row[5] || undefined,
          createdAt: row[6],
          updatedAt: row[7],
          deletedAt: row[8] || undefined,
        })
      } catch {
        console.error('Failed to parse meal row:', row)
      }
    }

    return meals
  }, [])

  // Parse rows to family members
  const rowsToFamily = useCallback((rows: string[][]): FamilyMember[] => {
    if (rows.length < 2) return []

    const members: FamilyMember[] = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length < 4) continue

      members.push({
        id: row[0],
        name: row[1],
        avatar: row[2] || undefined,
        createdAt: row[3],
        updatedAt: row[4] || row[3],
        deletedAt: row[5] || undefined,
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

  // Merge helper - takes the most recent version of each item
  const mergeMeals = useCallback((local: Meal[], cloud: Meal[]): Meal[] => {
    const mealsMap = new Map<string, Meal>()

    for (const meal of cloud) {
      mealsMap.set(meal.id, meal)
    }

    for (const meal of local) {
      const existing = mealsMap.get(meal.id)
      if (!existing) {
        mealsMap.set(meal.id, meal)
      } else {
        const localTime = new Date(meal.updatedAt).getTime()
        const cloudTime = new Date(existing.updatedAt).getTime()
        if (localTime > cloudTime) {
          mealsMap.set(meal.id, meal)
        }
      }
    }

    return Array.from(mealsMap.values())
  }, [])

  const mergeFamily = useCallback((local: FamilyMember[], cloud: FamilyMember[]): FamilyMember[] => {
    const membersMap = new Map<string, FamilyMember>()

    for (const member of cloud) {
      membersMap.set(member.id, member)
    }

    for (const member of local) {
      const existing = membersMap.get(member.id)
      if (!existing) {
        membersMap.set(member.id, member)
      } else {
        const localTime = new Date(member.updatedAt || member.createdAt).getTime()
        const cloudTime = new Date(existing.updatedAt || existing.createdAt).getTime()
        if (localTime > cloudTime) {
          membersMap.set(member.id, member)
        }
      }
    }

    return Array.from(membersMap.values())
  }, [])

  // Sync local data to Google Sheets
  const syncToCloud = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Nie jesteś połączony z Google Sheets')
    }
    if (!spreadsheetId) {
      throw new Error('Nie podano ID arkusza')
    }

    setIsSyncing(true)
    setError(null)

    try {
      const { meals, familyMembers } = getLocalData()

      const mealsRows = mealsToRows(meals)
      const familyRows = familyToRows(familyMembers)

      await Promise.all([
        writeSheet(MEALS_SHEET_NAME, mealsRows),
        writeSheet(FAMILY_SHEET_NAME, familyRows),
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
  }, [isConnected, spreadsheetId, getLocalData, mealsToRows, familyToRows, writeSheet])

  // Sync data from Google Sheets to local
  const syncFromCloud = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      throw new Error('Nie jesteś połączony z Google Sheets')
    }
    if (!spreadsheetId) {
      throw new Error('Nie podano ID arkusza')
    }

    setIsSyncing(true)
    setError(null)

    try {
      const [mealsRows, familyRows] = await Promise.all([
        readSheet(MEALS_SHEET_NAME).catch(() => []),
        readSheet(FAMILY_SHEET_NAME).catch(() => []),
      ])

      if (mealsRows.length < 2 && familyRows.length < 2) {
        setIsSyncing(false)
        return false
      }

      const meals = rowsToMeals(mealsRows)
      const familyMembers = rowsToFamily(familyRows)

      saveLocalData(meals, familyMembers)

      const now = new Date().toISOString()
      setLastSyncedAt(now)
      localStorage.setItem(LAST_SYNC_KEY, now)

      options?.onDataImported?.()

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Błąd pobierania danych'
      setError(message)
      throw err
    } finally {
      setIsSyncing(false)
    }
  }, [isConnected, spreadsheetId, readSheet, rowsToMeals, rowsToFamily, saveLocalData, options])

  // Two-way sync: merge local and cloud data
  const sync = useCallback(async (): Promise<void> => {
    if (!isConnected) {
      throw new Error('Nie jesteś połączony z Google Sheets')
    }
    if (!spreadsheetId) {
      throw new Error('Nie podano ID arkusza')
    }

    setIsSyncing(true)
    setError(null)

    try {
      const localData = getLocalData()

      const [mealsRows, familyRows] = await Promise.all([
        readSheet(MEALS_SHEET_NAME).catch(() => []),
        readSheet(FAMILY_SHEET_NAME).catch(() => []),
      ])

      const cloudMeals = rowsToMeals(mealsRows)
      const cloudFamily = rowsToFamily(familyRows)

      const mergedMeals = mergeMeals(localData.meals, cloudMeals)
      const mergedFamily = mergeFamily(localData.familyMembers, cloudFamily)

      const mergedMealsRows = mealsToRows(mergedMeals)
      const mergedFamilyRows = familyToRows(mergedFamily)

      await Promise.all([
        writeSheet(MEALS_SHEET_NAME, mergedMealsRows),
        writeSheet(FAMILY_SHEET_NAME, mergedFamilyRows),
      ])

      saveLocalData(mergedMeals, mergedFamily)

      const now = new Date().toISOString()
      setLastSyncedAt(now)
      localStorage.setItem(LAST_SYNC_KEY, now)

      options?.onDataImported?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Błąd synchronizacji'
      setError(message)
      throw err
    } finally {
      setIsSyncing(false)
    }
  }, [isConnected, spreadsheetId, getLocalData, readSheet, rowsToMeals, rowsToFamily, mergeMeals, mergeFamily, mealsToRows, familyToRows, writeSheet, saveLocalData, options])

  const isConfigured = Boolean(clientId)

  // Auto-sync debounce ref
  const autoSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAutoSyncingRef = useRef(false)

  // Auto-sync to cloud (debounced, silent - no UI state changes)
  const autoSyncToCloud = useCallback(async () => {
    // Skip if not connected, no spreadsheet, or already syncing
    if (!accessTokenRef.current || !spreadsheetId || isAutoSyncingRef.current) {
      return
    }

    isAutoSyncingRef.current = true

    try {
      const { meals, familyMembers } = getLocalData()

      const mealsRows = mealsToRows(meals)
      const familyRows = familyToRows(familyMembers)

      await Promise.all([
        writeSheet(MEALS_SHEET_NAME, mealsRows),
        writeSheet(FAMILY_SHEET_NAME, familyRows),
      ])

      const now = new Date().toISOString()
      setLastSyncedAt(now)
      localStorage.setItem(LAST_SYNC_KEY, now)
    } catch (err) {
      // Silent fail for auto-sync - don't disrupt user experience
      console.error('Auto-sync failed:', err)
    } finally {
      isAutoSyncingRef.current = false
    }
  }, [spreadsheetId, getLocalData, mealsToRows, familyToRows, writeSheet])

  // Trigger auto-sync with debounce
  const triggerAutoSync = useCallback(() => {
    if (autoSyncTimeoutRef.current) {
      clearTimeout(autoSyncTimeoutRef.current)
    }

    autoSyncTimeoutRef.current = setTimeout(() => {
      autoSyncToCloud()
    }, AUTO_SYNC_DEBOUNCE)
  }, [autoSyncToCloud])

  // Listen for data change events and trigger auto-sync
  useEffect(() => {
    const handleDataChanged = () => {
      triggerAutoSync()
    }

    window.addEventListener(DATA_CHANGED_EVENT, handleDataChanged)

    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, handleDataChanged)
      if (autoSyncTimeoutRef.current) {
        clearTimeout(autoSyncTimeoutRef.current)
      }
    }
  }, [triggerAutoSync])

  return {
    isConnected,
    isLoading,
    isSyncing,
    lastSyncedAt,
    error,
    isConfigured,
    spreadsheetId,
    spreadsheets,
    isLoadingSpreadsheets,
    connect,
    disconnect,
    updateSpreadsheetId,
    listSpreadsheets,
    createSpreadsheet,
    syncToCloud,
    syncFromCloud,
    sync,
    triggerAutoSync,
  }
}
