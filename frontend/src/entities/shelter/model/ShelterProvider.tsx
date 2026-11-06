import { useMemo, type ReactNode } from 'react'
import { useAsyncList } from '../../../shared/lib/index.ts'
import { shelterApi } from '../api/shelterApi.ts'
import { ShelterContext, type ShelterStore } from './context.ts'

export function ShelterProvider({ children }: { children: ReactNode }) {
  const { items, status, error, reload } = useAsyncList(shelterApi.list)

  const store = useMemo<ShelterStore>(
    () => ({ shelters: items, status, error, reload }),
    [items, status, error, reload],
  )

  return <ShelterContext.Provider value={store}>{children}</ShelterContext.Provider>
}
