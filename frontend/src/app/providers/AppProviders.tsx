import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { SessionProvider } from '../../entities/session/index.ts'
import { NotificationProvider } from '../../shared/ui/index.ts'
import { theme } from '../theme.ts'

/**
 * Глобальные провайдеры приложения. Хранилища лекарств и приютов подключаются
 * не здесь, а в закрытой части маршрутов (app/router/guards.tsx) — только после входа.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <NotificationProvider>
          <SessionProvider>{children}</SessionProvider>
        </NotificationProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
