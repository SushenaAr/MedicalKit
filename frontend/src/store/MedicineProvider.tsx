import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { demoMedicines, demoShelters } from '../data/demoData.ts'
import type { Medicine } from '../types.ts'
import { MedicineContext, type MedicineStore } from './context.ts'

// На этом этапе данные живут только в памяти браузера;
// в следующих лабораторных их заменит API на FastAPI.
export function MedicineProvider({ children }: { children: ReactNode }) {
  const [medicines, setMedicines] = useState<Medicine[]>(demoMedicines)

  const update = useCallback((id: string, change: (m: Medicine) => Medicine) => {
    setMedicines((list) => list.map((m) => (m.id === id ? change(m) : m)))
  }, [])

  const store = useMemo<MedicineStore>(
    () => ({
      medicines,
      shelters: demoShelters,
      addMedicine: (data) => {
        const medicine: Medicine = { ...data, id: crypto.randomUUID() }
        setMedicines((list) => [medicine, ...list])
        return medicine
      },
      removeMedicine: (id) => setMedicines((list) => list.filter((m) => m.id !== id)),
      setOpened: (id, opened) => update(id, (m) => ({ ...m, opened })),
      planDonation: (id) =>
        update(id, (m) => ({ ...m, donation: { shelterId: null, status: 'planned' } })),
      setDonationShelter: (id, shelterId) =>
        update(id, (m) => (m.donation ? { ...m, donation: { ...m.donation, shelterId } } : m)),
      markHanded: (id) =>
        update(id, (m) => (m.donation ? { ...m, donation: { ...m.donation, status: 'handed' } } : m)),
      cancelDonation: (id) => update(id, (m) => ({ ...m, donation: undefined })),
    }),
    [medicines, update],
  )

  return <MedicineContext.Provider value={store}>{children}</MedicineContext.Provider>
}
