import { daysUntil, isValidIsoDate } from '../../../shared/lib/index.ts'
import type { Medicine, MedicineForm, MedicineInput } from '../../../entities/medicine/index.ts'

/** Значения полей формы — то, что пользователь видит и редактирует */
export interface MedicineFormValues {
  name: string
  substance: string
  form: MedicineForm
  quantity: string
  expiresAt: string
  opened: boolean
  location: string
  notes: string
}

export type FieldName = keyof MedicineFormValues
export type FormErrors = Partial<Record<FieldName, string>>

export const LIMITS = {
  nameMin: 2,
  name: 80,
  substance: 120,
  quantity: 30,
  location: 80,
  notes: 500,
  maxYearsAhead: 15,
} as const

/** Порядок полей — чтобы при ошибке переводить фокус на первое неверное поле */
export const FIELD_ORDER: FieldName[] = [
  'name',
  'substance',
  'form',
  'quantity',
  'expiresAt',
  'location',
  'notes',
  'opened',
]

export const EMPTY_VALUES: MedicineFormValues = {
  name: '',
  substance: '',
  form: 'tablets',
  quantity: '',
  expiresAt: '',
  opened: false,
  location: '',
  notes: '',
}

export function valuesFromMedicine(medicine: Medicine): MedicineFormValues {
  return {
    name: medicine.name,
    substance: medicine.substance,
    form: medicine.form,
    quantity: medicine.quantity,
    expiresAt: medicine.expiresAt,
    opened: medicine.opened,
    location: medicine.location,
    notes: medicine.notes ?? '',
  }
}

export function toInput(values: MedicineFormValues): MedicineInput {
  return {
    name: values.name.trim(),
    substance: values.substance.trim(),
    form: values.form,
    quantity: values.quantity.trim(),
    expiresAt: values.expiresAt,
    opened: values.opened,
    location: values.location.trim(),
    notes: values.notes.trim() || undefined,
  }
}

export interface ValidationContext {
  /** Лекарство в списке «отдать до срока» — его нельзя сделать непригодным для передачи */
  inDonationList?: boolean
}

export function validate(
  values: MedicineFormValues,
  { inDonationList = false }: ValidationContext = {},
): FormErrors {
  const errors: FormErrors = {}
  const name = values.name.trim()
  const quantity = values.quantity.trim()
  const location = values.location.trim()

  if (!name) errors.name = 'Укажите название'
  else if (name.length < LIMITS.nameMin)
    errors.name = `Название слишком короткое — минимум ${LIMITS.nameMin} символа`
  else if (name.length > LIMITS.name) errors.name = `Не длиннее ${LIMITS.name} символов`

  if (values.substance.trim().length > LIMITS.substance) {
    errors.substance = `Не длиннее ${LIMITS.substance} символов`
  }

  if (quantity.length > LIMITS.quantity) errors.quantity = `Не длиннее ${LIMITS.quantity} символов`
  else if (quantity && !/\d/.test(quantity)) errors.quantity = 'Укажите количество числом, например «20 таб.»'

  if (!values.expiresAt) {
    errors.expiresAt = 'Укажите срок годности'
  } else if (!isValidIsoDate(values.expiresAt)) {
    errors.expiresAt = 'Некорректная дата'
  } else if (daysUntil(values.expiresAt) > LIMITS.maxYearsAhead * 366) {
    errors.expiresAt = `Срок больше ${LIMITS.maxYearsAhead} лет — проверьте год`
  } else if (Number(values.expiresAt.slice(0, 4)) < 2000) {
    errors.expiresAt = 'Проверьте год'
  }

  if (!location) errors.location = 'Укажите, где хранится лекарство'
  else if (location.length > LIMITS.location) errors.location = `Не длиннее ${LIMITS.location} символов`

  if (values.notes.trim().length > LIMITS.notes) errors.notes = `Не длиннее ${LIMITS.notes} символов`

  if (inDonationList && values.opened) {
    errors.opened =
      'Лекарство в списке «отдать до срока»: вскрытое передать нельзя. Сначала уберите его из списка.'
  }

  return errors
}

/** Предупреждение, которое не мешает сохранению */
export function expiryWarning(values: MedicineFormValues): string | null {
  if (!isValidIsoDate(values.expiresAt)) return null
  const days = daysUntil(values.expiresAt)
  if (days < 0) return 'Срок годности уже истёк — лекарство будет отмечено как просроченное.'
  if (days <= 30) return 'Срок годности истекает в течение месяца.'
  return null
}

export function isSameValues(a: MedicineFormValues, b: MedicineFormValues): boolean {
  return FIELD_ORDER.every((key) => a[key] === b[key])
}
