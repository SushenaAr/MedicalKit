import { useContext } from 'react'
import { NotificationContext } from './context.ts'

/** Показать всплывающее уведомление о результате действия пользователя */
export function useNotify() {
  const notify = useContext(NotificationContext)
  if (!notify) {
    throw new Error('useNotify должен вызываться внутри NotificationProvider')
  }
  return notify
}
