import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { errorMessage } from '../api/errors.ts'

export type LoadStatus = 'loading' | 'error' | 'success'

export interface AsyncList<T> {
  items: T[]
  status: LoadStatus
  error: string | null
  reload: () => void
  /** Локальное обновление списка после успешной операции изменения */
  setItems: Dispatch<SetStateAction<T[]>>
}

/** Загружает список при монтировании и хранит состояние загрузки, ошибки и данных */
export function useAsyncList<T>(load: () => Promise<T[]>): AsyncList<T> {
  const [items, setItems] = useState<T[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const run = useCallback(() => {
    const id = ++requestId.current
    setStatus('loading')
    setError(null)
    load().then(
      (data) => {
        if (id !== requestId.current) return
        setItems(data)
        setStatus('success')
      },
      (reason: unknown) => {
        if (id !== requestId.current) return
        setError(errorMessage(reason))
        setStatus('error')
      },
    )
  }, [load])

  useEffect(() => {
    run()
    // При размонтировании ответы устаревших запросов игнорируются
    const latest = requestId
    return () => {
      latest.current++
    }
  }, [run])

  return { items, status, error, reload: run, setItems }
}
