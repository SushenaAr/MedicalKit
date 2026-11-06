import { ApiError, demoMode, fakeRequest } from '../../../shared/api/index.ts'
import { donateBlockReason } from '../model/donation.ts'
import type { Donation, Medicine, MedicineInput, MedicinePatch } from '../model/types.ts'
import { demoMedicines } from './demoData.ts'

// Демонстрационный «сервер» в памяти браузера. Он повторяет бизнес-правила backend (ЛР 2),
// поэтому при интеграции с API в следующей работе заменятся только тела этих функций.
let db: Medicine[] = demoMode === 'empty' ? [] : structuredClone(demoMedicines)

function find(id: string): Medicine {
  const medicine = db.find((m) => m.id === id)
  if (!medicine) throw new ApiError('Лекарство не найдено — возможно, его уже удалили.')
  return medicine
}

function save(medicine: Medicine): Medicine {
  db = db.map((m) => (m.id === medicine.id ? medicine : m))
  return medicine
}

function setDonation(id: string, change: (medicine: Medicine) => Donation | undefined): Medicine {
  const medicine = find(id)
  if (medicine.donation?.status === 'handed') {
    throw new ApiError('Лекарство уже передано — запись о передаче изменить нельзя.')
  }
  return save({ ...medicine, donation: change(medicine) })
}

export const medicineApi = {
  list: (attempt = 0): Promise<Medicine[]> => fakeRequest(() => db, { attempt }),

  create: (input: MedicineInput): Promise<Medicine> =>
    fakeRequest(() => {
      const medicine: Medicine = { ...input, id: crypto.randomUUID() }
      db = [medicine, ...db]
      return medicine
    }),

  update: (id: string, patch: MedicinePatch): Promise<Medicine> =>
    fakeRequest(() => {
      const current = find(id)
      const next: Medicine = { ...current, ...patch }
      // Как и на backend: нельзя сделать лекарство из списка на передачу непригодным для передачи
      if (current.donation?.status === 'planned') {
        const reason = donateBlockReason(next)
        if (reason) {
          throw new ApiError(`Лекарство в списке «отдать до срока». ${reason} Сначала уберите его из списка.`)
        }
      }
      return save(next)
    }),

  remove: (id: string): Promise<void> =>
    fakeRequest(() => {
      find(id)
      db = db.filter((m) => m.id !== id)
    }),

  planDonation: (id: string): Promise<Medicine> =>
    fakeRequest(() =>
      setDonation(id, (medicine) => {
        if (medicine.donation) throw new ApiError('Лекарство уже в списке на передачу.')
        const reason = donateBlockReason(medicine)
        if (reason) throw new ApiError(reason)
        return { shelterId: null, status: 'planned' }
      }),
    ),

  setDonationShelter: (id: string, shelterId: string | null): Promise<Medicine> =>
    fakeRequest(() =>
      setDonation(id, (medicine) => {
        if (!medicine.donation) throw new ApiError('Лекарства нет в списке на передачу.')
        return { ...medicine.donation, shelterId }
      }),
    ),

  markHanded: (id: string): Promise<Medicine> =>
    fakeRequest(() =>
      setDonation(id, (medicine) => {
        if (!medicine.donation?.shelterId) throw new ApiError('Сначала выберите приют.')
        return { ...medicine.donation, status: 'handed' }
      }),
    ),

  cancelDonation: (id: string): Promise<Medicine> => fakeRequest(() => setDonation(id, () => undefined)),
}
