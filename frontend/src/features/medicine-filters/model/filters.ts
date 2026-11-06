import {
  byExpiry,
  byName,
  statusOf,
  type ExpiryStatus,
  type Medicine,
} from '../../../entities/medicine/index.ts'

export type StatusFilter = 'all' | ExpiryStatus
export type SortOrder = 'expiry' | 'name'

export interface MedicineFilters {
  status: StatusFilter
  query: string
  sort: SortOrder
}

export const STATUS_FILTERS: StatusFilter[] = ['all', 'ok', 'soon', 'expired']

export const SORT_LABELS: Record<SortOrder, string> = {
  expiry: 'По сроку годности',
  name: 'По названию',
}

export function parseStatus(value: string | null): StatusFilter {
  return STATUS_FILTERS.includes(value as StatusFilter) ? (value as StatusFilter) : 'all'
}

export function parseSort(value: string | null): SortOrder {
  return value === 'name' ? 'name' : 'expiry'
}

function matchesQuery(medicine: Medicine, query: string): boolean {
  const text = query.trim().toLowerCase()
  if (!text) return true
  return [medicine.name, medicine.substance, medicine.location].some((field) =>
    field.toLowerCase().includes(text),
  )
}

/** Количество лекарств по статусам с учётом текстового поиска — для подписей фильтров */
export function countByStatus(medicines: Medicine[], query: string): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = { all: 0, ok: 0, soon: 0, expired: 0 }
  for (const medicine of medicines) {
    if (!matchesQuery(medicine, query)) continue
    counts.all++
    counts[statusOf(medicine)]++
  }
  return counts
}

export function applyFilters(medicines: Medicine[], { status, query, sort }: MedicineFilters): Medicine[] {
  return medicines
    .filter((m) => (status === 'all' || statusOf(m) === status) && matchesQuery(m, query))
    .sort(sort === 'name' ? byName : byExpiry)
}

export function hasActiveFilters({ status, query }: MedicineFilters): boolean {
  return status !== 'all' || query.trim() !== ''
}
