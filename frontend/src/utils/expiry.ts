import type { Medicine, Shelter } from '../types.ts'

const DAY_MS = 24 * 60 * 60 * 1000

/** Сколько дней до истечения срока считается «скоро истекает» */
export const SOON_DAYS = 30
/** Меньше этого остатка лекарство уже не предлагаем отдавать */
export const DONATE_MIN_DAYS = 30
/** Больше этого остатка лекарство можно спокойно оставить себе */
export const DONATE_SUGGEST_MAX_DAYS = 180

export type ExpiryStatus = 'expired' | 'soon' | 'ok'

export function daysLeft(expiresAt: string, today: Date = new Date()): number {
  const end = new Date(`${expiresAt}T00:00:00`)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((end.getTime() - start.getTime()) / DAY_MS)
}

export function expiryStatus(days: number): ExpiryStatus {
  if (days < 0) return 'expired'
  if (days <= SOON_DAYS) return 'soon'
  return 'ok'
}

export function statusOf(medicine: Medicine): ExpiryStatus {
  return expiryStatus(daysLeft(medicine.expiresAt))
}

/** Можно ли в принципе передать лекарство: упаковка целая и срок ещё позволяет */
export function canDonate(medicine: Medicine): boolean {
  return !medicine.opened && daysLeft(medicine.expiresAt) >= DONATE_MIN_DAYS
}

/** Лекарства, которые стоит отдать, пока они кому-то пригодятся */
export function isDonationSuggested(medicine: Medicine): boolean {
  return (
    canDonate(medicine) &&
    !medicine.donation &&
    daysLeft(medicine.expiresAt) <= DONATE_SUGGEST_MAX_DAYS
  )
}

export function shelterAccepts(shelter: Shelter, medicine: Medicine): boolean {
  return daysLeft(medicine.expiresAt) >= shelter.minMonthsLeft * 30
}

export function byExpiry(a: Medicine, b: Medicine): number {
  return a.expiresAt.localeCompare(b.expiresAt)
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function pluralDays(n: number): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return 'дней'
  if (last === 1) return 'день'
  if (last >= 2 && last <= 4) return 'дня'
  return 'дней'
}

/** Дата через `offset` дней от сегодняшней в формате YYYY-MM-DD */
export function dateFromToday(offset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
