import type { Location } from 'react-router-dom'
import { routes } from '../../shared/config/routes.ts'

/** Состояние перехода на страницу входа: откуда пользователя перенаправили */
export interface AuthRedirectState {
  from?: Pick<Location, 'pathname' | 'search'>
}

/** Куда вернуть пользователя после входа: на страницу, которую он открывал, или на главную */
export function redirectTarget(state: unknown): string {
  const from = (state as AuthRedirectState | null)?.from
  if (!from || from.pathname === routes.login() || from.pathname === routes.register()) {
    return routes.dashboard()
  }
  return `${from.pathname}${from.search}`
}
