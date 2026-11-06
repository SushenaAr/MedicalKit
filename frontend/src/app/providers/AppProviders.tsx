import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { MedicineProvider } from '../../entities/medicine/index.ts'
import { ShelterProvider } from '../../entities/shelter/index.ts'
import { NotificationProvider } from '../../shared/ui/index.ts'
import { theme } from '../theme.ts'

/** Все глобальные провайдеры приложения в одном месте */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <NotificationProvider>
          <ShelterProvider>
            <MedicineProvider>{children}</MedicineProvider>
          </ShelterProvider>
        </NotificationProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
