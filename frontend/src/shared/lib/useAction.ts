import { useCallback, useState } from 'react'
import { errorMessage } from '../api/fakeRequest.ts'
import { useNotify } from '../ui/notifications/useNotify.ts'

interface ActionOptions<R> {
  /** Сообщение после успешного выполнения (строка или функция от результата) */
  success?: string | ((result: R) => string)
  onSuccess?: (result: R) => void
}

/**
 * Обёртка для действий пользователя, которые меняют данные:
 * хранит признак выполнения (для блокировки кнопок) и показывает уведомление
 * об успехе или понятное сообщение об ошибке.
 */
export function useAction<A extends unknown[], R>(
  action: (...args: A) => Promise<R>,
  { success, onSuccess }: ActionOptions<R> = {},
) {
  const notify = useNotify()
  const [pending, setPending] = useState(false)

  const run = useCallback(
    async (...args: A): Promise<boolean> => {
      setPending(true)
      try {
        const result = await action(...args)
        if (success) {
          notify({ message: typeof success === 'function' ? success(result) : success, severity: 'success' })
        }
        onSuccess?.(result)
        return true
      } catch (error) {
        notify({ message: errorMessage(error), severity: 'error' })
        return false
      } finally {
        setPending(false)
      }
    },
    [action, success, onSuccess, notify],
  )

  return { run, pending }
}
