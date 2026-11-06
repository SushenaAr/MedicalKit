// Публичный API сущности «Приют»: остальные слои импортируют только отсюда
export type { Shelter, ShelterKind } from './model/types.ts'
export { SHELTER_KIND_LABELS } from './model/types.ts'
export { ShelterProvider } from './model/ShelterProvider.tsx'
export { useShelters } from './model/useShelters.ts'
export { ShelterCard, ShelterCardSkeleton } from './ui/ShelterCard.tsx'
export { ShelterKindChip } from './ui/ShelterKindChip.tsx'
