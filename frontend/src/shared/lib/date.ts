const DAY_MS = 24 * 60 * 60 * 1000

/** Сколько полных дней осталось от сегодняшнего дня до даты YYYY-MM-DD (отрицательное — дата прошла) */
export function daysUntil(isoDate: string, today: Date = new Date()): number {
  const end = new Date(`${isoDate}T00:00:00`)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((end.getTime() - start.getTime()) / DAY_MS)
}

/** Корректна ли строка как календарная дата YYYY-MM-DD */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime()) && toIsoDate(date) === value
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Дата через `offset` дней от сегодняшней в формате YYYY-MM-DD */
export function dateFromToday(offset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return toIsoDate(date)
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
