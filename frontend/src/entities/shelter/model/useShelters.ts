import { useContext } from 'react'
import { ShelterContext } from './context.ts'

export function useShelters() {
  const store = useContext(ShelterContext)
  if (!store) {
    throw new Error('useShelters должен вызываться внутри ShelterProvider')
  }
  return store
}
