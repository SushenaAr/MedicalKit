import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import MedicinesPage from './pages/MedicinesPage.tsx'
import MedicineDetailsPage from './pages/MedicineDetailsPage.tsx'
import AddMedicinePage from './pages/AddMedicinePage.tsx'
import DonatePage from './pages/DonatePage.tsx'
import SheltersPage from './pages/SheltersPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="medicines" element={<MedicinesPage />} />
        <Route path="medicines/new" element={<AddMedicinePage />} />
        <Route path="medicines/:id" element={<MedicineDetailsPage />} />
        <Route path="donate" element={<DonatePage />} />
        <Route path="shelters" element={<SheltersPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
