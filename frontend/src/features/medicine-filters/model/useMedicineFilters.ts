import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseSort, parseStatus, type MedicineFilters } from './filters.ts'

function parseFilters(params: URLSearchParams): MedicineFilters {
  return {
    status: parseStatus(params.get('status')),
    query: params.get('q') ?? '',
    sort: parseSort(params.get('sort')),
  }
}

function toSearchParams({ status, query, sort }: MedicineFilters): URLSearchParams {
  const search = new URLSearchParams()
  if (status !== 'all') search.set('status', status)
  if (query) search.set('q', query)
  if (sort !== 'expiry') search.set('sort', sort)
  return search
}

/**
 * Фильтры списка хранятся в адресе страницы (?status=&q=&sort=):
 * ими можно поделиться, а кнопка «Назад» возвращает к тем же результатам.
 */
export function useMedicineFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])

  const setFilters = useCallback(
    (change: Partial<MedicineFilters>) => {
      // Новое состояние строится от текущего адреса, а не от значения из последнего рендера:
      // роутер применяет навигацию в transition, и при быстрой смене фильтра и вводе текста
      // значение из замыкания может быть устаревшим — тогда терялся бы только что выбранный статус.
      const current = parseFilters(new URLSearchParams(window.location.search))
      // Ввод текста не засоряет историю браузера, смена фильтра — добавляет запись
      setParams(toSearchParams({ ...current, ...change }), { replace: 'query' in change })
    },
    [setParams],
  )

  const resetFilters = useCallback(() => setParams({}), [setParams])

  return { filters, setFilters, resetFilters }
}
