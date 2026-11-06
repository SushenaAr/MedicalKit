import { Route, Routes } from 'react-router-dom'
import { AddMedicinePage } from '../pages/add-medicine/index.ts'
import { DashboardPage } from '../pages/dashboard/index.ts'
import { DonatePage } from '../pages/donate/index.ts'
import { EditMedicinePage } from '../pages/edit-medicine/index.ts'
import { MedicineDetailsPage } from '../pages/medicine-details/index.ts'
import { MedicinesPage } from '../pages/medicines/index.ts'
import { NotFoundPage } from '../pages/not-found/index.ts'
import { SheltersPage } from '../pages/shelters/index.ts'
import { AppLayout } from './layout/AppLayout.tsx'
import { AppProviders } from './providers/AppProviders.tsx'

export function App() {
  return (
    <AppProviders>
      <Routes>
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
      </Routes>
    </AppProviders>
  )
}
