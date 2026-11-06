import { Route, Routes } from 'react-router-dom'
import { AddMedicinePage } from '../pages/add-medicine/index.ts'
import { DashboardPage } from '../pages/dashboard/index.ts'
import { DonatePage } from '../pages/donate/index.ts'
import { EditMedicinePage } from '../pages/edit-medicine/index.ts'
import { LoginPage } from '../pages/login/index.ts'
import { MedicineDetailsPage } from '../pages/medicine-details/index.ts'
import { MedicinesPage } from '../pages/medicines/index.ts'
import { NotFoundPage } from '../pages/not-found/index.ts'
import { RegisterPage } from '../pages/register/index.ts'
import { SheltersPage } from '../pages/shelters/index.ts'
import { AppLayout } from './layout/AppLayout.tsx'
import { AppProviders } from './providers/AppProviders.tsx'
import { GuestOnly, RequireAuth } from './router/guards.tsx'

export function App() {
  return (
    <AppProviders>
      <Routes>
        {/* Публичные страницы */}
        <Route path="login" element={<GuestOnly>{(to) => <LoginPage redirectTo={to} />}</GuestOnly>} />
        <Route path="register" element={<GuestOnly>{(to) => <RegisterPage redirectTo={to} />}</GuestOnly>} />

        {/* Закрытая часть: только после входа */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="medicines" element={<MedicinesPage />} />
            <Route path="medicines/new" element={<AddMedicinePage />} />
            <Route path="medicines/:id" element={<MedicineDetailsPage />} />
            <Route path="medicines/:id/edit" element={<EditMedicinePage />} />
            <Route path="donate" element={<DonatePage />} />
            <Route path="shelters" element={<SheltersPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </AppProviders>
  )
}
