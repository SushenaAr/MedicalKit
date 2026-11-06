import type { Shelter } from '../../shelter/index.ts'
import { daysLeft, statusOf } from './expiry.ts'
import type { Medicine } from './types.ts'

/** Меньше этого остатка лекарство уже не предлагаем отдавать */
export const DONATE_MIN_DAYS = 30
/** Больше этого остатка лекарство можно спокойно оставить себе */
export const DONATE_SUGGEST_MAX_DAYS = 180

/** Почему лекарство нельзя передать в приют; `null` — передать можно */
export function donateBlockReason(medicine: Medicine): string | null {
  if (statusOf(medicine) === 'expired') {
    return 'Срок годности истёк: лекарство нужно сдать на утилизацию, передавать его нельзя.'
  }
  if (medicine.opened) {
    return 'Приюты принимают только лекарства в невскрытой упаковке.'
  }
  if (daysLeft(medicine) < DONATE_MIN_DAYS) {
    return `До конца срока меньше ${DONATE_MIN_DAYS} дней — приюты такие лекарства обычно не берут.`
  }
  return null
}

/** Можно ли в принципе передать лекарство: упаковка целая и срок ещё позволяет */
export function canDonate(medicine: Medicine): boolean {
  return donateBlockReason(medicine) === null
}

/** Лекарства, которые стоит отдать, пока они кому-то пригодятся */
export function isDonationSuggested(medicine: Medicine): boolean {
  return canDonate(medicine) && !medicine.donation && daysLeft(medicine) <= DONATE_SUGGEST_MAX_DAYS
}

export function shelterAccepts(shelter: Shelter, medicine: Medicine): boolean {
  return daysLeft(medicine) >= shelter.minMonthsLeft * 30
}

export function isPlanned(medicine: Medicine): boolean {
  return medicine.donation?.status === 'planned'
}

export function isHanded(medicine: Medicine): boolean {
  return medicine.donation?.status === 'handed'
}
