/** Адреса страниц приложения — единое место, чтобы не дублировать строки маршрутов */
export const routes = {
  dashboard: () => '/',
  medicines: () => '/medicines',
  newMedicine: () => '/medicines/new',
  medicine: (id: string) => `/medicines/${id}`,
  editMedicine: (id: string) => `/medicines/${id}/edit`,
  donate: () => '/donate',
  shelters: () => '/shelters',
  login: () => '/login',
  register: () => '/register',
} as const
