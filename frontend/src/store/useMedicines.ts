import { useContext } from 'react'
import { MedicineContext } from './context.ts'

export function useMedicines() {
  const store = useContext(MedicineContext)
  if (!store) {
    throw new Error('useMedicines должен вызываться внутри MedicineProvider')
  }
  return store
}
