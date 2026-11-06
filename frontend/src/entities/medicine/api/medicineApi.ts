import { request } from '../../../shared/api/index.ts'
import type { DonationStatus, Medicine, MedicineForm, MedicineInput, MedicinePatch } from '../model/types.ts'

// Формат API (snake_case, числовые id) переводится в модель frontend в одном месте —
// остальной код не зависит от того, как данные выглядят на сервере.

interface MedicineDto {
  id: number
  name: string
  substance: string
  form: MedicineForm
  quantity: string
  expires_at: string
  opened: boolean
  location: string
  notes: string | null
  category: { id: number; name: string } | null
  donation: { id: number; status: DonationStatus; shelter_id: number | null } | null
}

function fromDto(dto: MedicineDto): Medicine {
  return {
    id: String(dto.id),
    name: dto.name,
    substance: dto.substance,
    form: dto.form,
    quantity: dto.quantity,
    expiresAt: dto.expires_at,
    opened: dto.opened,
    location: dto.location,
    notes: dto.notes ?? undefined,
    category: dto.category ? { id: String(dto.category.id), name: dto.category.name } : undefined,
    donation: dto.donation
      ? {
          id: String(dto.donation.id),
          status: dto.donation.status,
          shelterId: dto.donation.shelter_id === null ? null : String(dto.donation.shelter_id),
        }
      : undefined,
  }
}

const FIELD_NAMES: Record<keyof MedicineInput, string> = {
  name: 'name',
  substance: 'substance',
  form: 'form',
  quantity: 'quantity',
  expiresAt: 'expires_at',
  opened: 'opened',
  location: 'location',
  notes: 'notes',
}

function toBody(patch: MedicinePatch): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch) as [keyof MedicineInput, unknown][]) {
    // Пустые заметки отправляются как null, чтобы сервер очистил поле
    body[FIELD_NAMES[key]] = key === 'notes' ? (value ?? null) : value
  }
  return body
}

function donationId(medicine: Medicine): string {
  if (!medicine.donation) throw new Error('Лекарства нет в списке на передачу')
  return medicine.donation.id
}

const get = async (id: string): Promise<Medicine> => fromDto(await request<MedicineDto>(`/medicines/${id}`))

export const medicineApi = {
  list: async (): Promise<Medicine[]> => (await request<MedicineDto[]>('/medicines')).map(fromDto),

  get,

  create: async (input: MedicineInput): Promise<Medicine> =>
    fromDto(await request<MedicineDto>('/medicines', { method: 'POST', body: toBody(input) })),

  update: async (id: string, patch: MedicinePatch): Promise<Medicine> =>
    fromDto(await request<MedicineDto>(`/medicines/${id}`, { method: 'PATCH', body: toBody(patch) })),

  remove: (id: string): Promise<void> => request<void>(`/medicines/${id}`, { method: 'DELETE' }),

  // Операции со списком на передачу возвращают запись о передаче; после них перечитываем лекарство,
  // чтобы карточка и списки сразу показывали актуальное состояние
  planDonation: async (medicine: Medicine): Promise<Medicine> => {
    await request('/donations', { method: 'POST', body: { medicine_id: Number(medicine.id) } })
    return get(medicine.id)
  },

  setDonationShelter: async (medicine: Medicine, shelterId: string | null): Promise<Medicine> => {
    await request(`/donations/${donationId(medicine)}`, {
      method: 'PATCH',
      body: { shelter_id: shelterId === null ? null : Number(shelterId) },
    })
    return get(medicine.id)
  },

  markHanded: async (medicine: Medicine): Promise<Medicine> => {
    await request(`/donations/${donationId(medicine)}`, { method: 'PATCH', body: { status: 'handed' } })
    return get(medicine.id)
  },

  cancelDonation: async (medicine: Medicine): Promise<Medicine> => {
    await request(`/donations/${donationId(medicine)}`, { method: 'DELETE' })
    return get(medicine.id)
  },
}
