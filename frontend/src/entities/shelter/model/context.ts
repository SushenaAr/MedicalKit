import { createContext } from 'react'
import type { LoadStatus } from '../../../shared/lib/index.ts'
import type { Shelter } from './types.ts'

export interface ShelterStore {
  shelters: Shelter[]
  status: LoadStatus
  error: string | null
  reload: () => void
}

export const ShelterContext = createContext<ShelterStore | null>(null)
