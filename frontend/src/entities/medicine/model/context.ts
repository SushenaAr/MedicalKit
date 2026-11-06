import { createContext } from 'react'
import type { LoadStatus } from '../../../shared/lib/index.ts'
import type { Medicine, MedicineInput, MedicinePatch } from './types.ts'

export interface MedicineStore {
  medicines: Medicine[]
  status: LoadStatus
  error: string | null
  reload: () => void
  create: (input: MedicineInput) => Promise<Medicine>
  update: (id: string, patch: MedicinePatch) => Promise<Medicine>
  remove: (id: string) => Promise<void>
  planDonation: (id: string) => Promise<Medicine>
  setDonationShelter: (id: string, shelterId: string | null) => Promise<Medicine>
  markHanded: (id: string) => Promise<Medicine>
  cancelDonation: (id: string) => Promise<Medicine>
}

export const MedicineContext = createContext<MedicineStore | null>(null)
