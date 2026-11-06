import { useCallback, useMemo, type ReactNode } from 'react'
import { useAsyncList } from '../../../shared/lib/index.ts'
import { medicineApi } from '../api/medicineApi.ts'
import { MedicineContext, type MedicineStore } from './context.ts'
import type { Medicine } from './types.ts'

/**
 * Хранилище лекарств: загружает список и выполняет операции через API.
 * Локальное состояние меняется только после успешного ответа, поэтому
 * при ошибке интерфейс остаётся в согласованном с «сервером» состоянии.
 */
export function MedicineProvider({ children }: { children: ReactNode }) {
  const { items, status, error, reload, setItems } = useAsyncList(medicineApi.list)

  const replace = useCallback(
    (medicine: Medicine) => {
      setItems((list) => list.map((m) => (m.id === medicine.id ? medicine : m)))
      return medicine
    },
    [setItems],
  )

  const store = useMemo<MedicineStore>(
    () => ({
      medicines: items,
      status,
      error,
      reload,
      create: async (input) => {
        const created = await medicineApi.create(input)
        setItems((list) => [created, ...list])
        return created
      },
      update: async (id, patch) => replace(await medicineApi.update(id, patch)),
      remove: async (id) => {
        await medicineApi.remove(id)
        setItems((list) => list.filter((m) => m.id !== id))
      },
      planDonation: async (id) => replace(await medicineApi.planDonation(id)),
      setDonationShelter: async (id, shelterId) =>
        replace(await medicineApi.setDonationShelter(id, shelterId)),
      markHanded: async (id) => replace(await medicineApi.markHanded(id)),
      cancelDonation: async (id) => replace(await medicineApi.cancelDonation(id)),
    }),
    [items, status, error, reload, setItems, replace],
  )

  return <MedicineContext.Provider value={store}>{children}</MedicineContext.Provider>
}
