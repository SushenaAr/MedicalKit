export type MedicineForm =
  'tablets' | 'capsules' | 'syrup' | 'drops' | 'ointment' | 'spray' | 'solution' | 'powder'

export const FORM_LABELS: Record<MedicineForm, string> = {
  tablets: 'Таблетки',
  capsules: 'Капсулы',
  syrup: 'Сироп',
  drops: 'Капли',
  ointment: 'Мазь',
  spray: 'Спрей',
  solution: 'Раствор',
  powder: 'Порошок',
}

export type DonationStatus = 'planned' | 'handed'

export interface Donation {
  shelterId: string | null
  status: DonationStatus
}

export interface Medicine {
  id: string
  name: string
  substance: string
  form: MedicineForm
  quantity: string
  /** Дата окончания срока годности в формате YYYY-MM-DD */
  expiresAt: string
  opened: boolean
  location: string
  notes?: string
  donation?: Donation
}

/** Данные, которые пользователь вводит в форме лекарства */
export type MedicineInput = Omit<Medicine, 'id' | 'donation'>

export type MedicinePatch = Partial<MedicineInput>
