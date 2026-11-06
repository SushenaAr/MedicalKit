// Публичный API сущности «Лекарство»: остальные слои импортируют только отсюда
export type {
  Donation,
  DonationStatus,
  Medicine,
  MedicineForm,
  MedicineCategory,
  MedicineInput,
  MedicinePatch,
} from './model/types.ts'
export { FORM_LABELS } from './model/types.ts'
export {
  byExpiry,
  byName,
  daysLeft,
  EXPIRY_STATUS_LABELS,
  expiryStatus,
  SOON_DAYS,
  statusOf,
  type ExpiryStatus,
} from './model/expiry.ts'
export {
  canDonate,
  DONATE_MIN_DAYS,
  DONATE_SUGGEST_MAX_DAYS,
  donateBlockReason,
  isDonationSuggested,
  isHanded,
  isPlanned,
  shelterAccepts,
  shelterRejectReason,
} from './model/donation.ts'
export { MedicineProvider } from './model/MedicineProvider.tsx'
export { useMedicines } from './model/useMedicines.ts'
export { useMedicine } from './model/useMedicine.ts'
export { MedicineCard, MedicineCardSkeleton } from './ui/MedicineCard.tsx'
export { ExpiryChip } from './ui/ExpiryChip.tsx'
export { DonationChip } from './ui/DonationChip.tsx'
