import { daysUntil } from '../../../shared/lib/index.ts'
import type { Medicine } from './types.ts'

/** Сколько дней до истечения срока считается «скоро истекает» */
export const SOON_DAYS = 30

export type ExpiryStatus = 'expired' | 'soon' | 'ok'

export const EXPIRY_STATUS_LABELS: Record<ExpiryStatus, string> = {
  ok: 'В порядке',
  soon: 'Скоро истекают',
  expired: 'Просрочены',
}

export function daysLeft(medicine: Pick<Medicine, 'expiresAt'>): number {
  return daysUntil(medicine.expiresAt)
}

export function expiryStatus(days: number): ExpiryStatus {
  if (days < 0) return 'expired'
  if (days <= SOON_DAYS) return 'soon'
  return 'ok'
}

export function statusOf(medicine: Pick<Medicine, 'expiresAt'>): ExpiryStatus {
  return expiryStatus(daysLeft(medicine))
}

export function byExpiry(a: Medicine, b: Medicine): number {
  return a.expiresAt.localeCompare(b.expiresAt)
}

export function byName(a: Medicine, b: Medicine): number {
  return a.name.localeCompare(b.name, 'ru')
}
