export interface FamilyMember {
  id: string
  name: string
  avatar?: string
  createdAt: string
}

export interface MealRating {
  memberId: string
  liked: boolean
}

export interface Meal {
  id: string
  name: string
  date: string
  ratings: MealRating[]
  ingredients?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface AppState {
  meals: Meal[]
  familyMembers: FamilyMember[]
  lastSyncedAt?: string
}

// Preferencje dla konkretnego dania (nazwa dania -> oceny członków rodziny)
export interface MealPreference {
  memberId: string
  liked: boolean
}

export interface DishPreferences {
  [dishName: string]: MealPreference[]
}

export type StorageProvider = 'local' | 'google-drive'

// Google Drive sync status
export interface GoogleDriveState {
  isConnected: boolean
  isLoading: boolean
  lastSyncedAt: string | null
  error: string | null
}
