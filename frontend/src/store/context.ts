import { createContext } from 'react'
import type { Medicine, NewMedicine, Shelter } from '../types.ts'

export interface MedicineStore {
  medicines: Medicine[]
  shelters: Shelter[]
  addMedicine: (data: NewMedicine) => Medicine
  removeMedicine: (id: string) => void
  setOpened: (id: string, opened: boolean) => void
  planDonation: (id: string) => void
  setDonationShelter: (id: string, shelterId: string | null) => void
  markHanded: (id: string) => void
  cancelDonation: (id: string) => void
}

export const MedicineContext = createContext<MedicineStore | null>(null)
