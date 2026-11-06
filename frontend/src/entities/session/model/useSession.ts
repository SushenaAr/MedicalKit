import { useContext } from 'react'
import { SessionContext } from './context.ts'

export function useSession() {
  const store = useContext(SessionContext)
  if (!store) {
    throw new Error('useSession должен вызываться внутри SessionProvider')
  }
  return store
}
