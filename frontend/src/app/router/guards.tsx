import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { MedicineProvider } from '../../entities/medicine/index.ts'
import { useSession } from '../../entities/session/index.ts'
import { ShelterProvider } from '../../entities/shelter/index.ts'
import { routes } from '../../shared/config/routes.ts'
import { redirectTarget, type AuthRedirectState } from './redirect.ts'

function SessionCheck() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <Box>
        <CircularProgress />
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Проверяем вход…
        </Typography>
      </Box>
    </Box>
  )
}

/**
 * Закрытая часть приложения. Неавторизованного пользователя отправляет на страницу входа,
 * запомнив, куда он шёл. Данные пользователя загружаются только после входа, а при выходе
 * хранилища размонтируются — состояние на клиенте очищается.
 */
export function RequireAuth() {
  const { status } = useSession()
  const location = useLocation()

  if (status === 'checking') return <SessionCheck />
  if (status === 'anonymous') {
    const state: AuthRedirectState = { from: { pathname: location.pathname, search: location.search } }
    return <Navigate to={routes.login()} state={state} replace />
  }
  return (
    <ShelterProvider>
      <MedicineProvider>
        <Outlet />
      </MedicineProvider>
    </ShelterProvider>
  )
}

/** Страницы входа и регистрации: вошедшего пользователя сразу отправляют дальше */
export function GuestOnly({ children }: { children: (redirectTo: string) => ReactNode }) {
  const { status } = useSession()
  const location = useLocation()
  const redirectTo = redirectTarget(location.state)

  if (status === 'checking') return <SessionCheck />
  if (status === 'authenticated') return <Navigate to={redirectTo} replace />
  return children(redirectTo)
}
