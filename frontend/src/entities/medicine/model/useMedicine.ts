import { useMedicines } from './useMedicines.ts'

/** Одно лекарство по id вместе с состоянием загрузки списка */
export function useMedicine(id: string | undefined) {
  const { medicines, status, error, reload } = useMedicines()
  const medicine = medicines.find((m) => m.id === id)
  return { medicine, status, error, reload }
}
