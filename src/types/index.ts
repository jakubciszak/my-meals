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

export type StorageProvider = 'local' | 'google-drive'
