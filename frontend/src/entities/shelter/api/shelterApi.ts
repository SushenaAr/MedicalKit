import { demoMode, fakeRequest } from '../../../shared/api/index.ts'
import type { Shelter } from '../model/types.ts'
import { demoShelters } from './demoData.ts'

// Демонстрационный источник данных; в следующей работе здесь будет запрос GET /api/shelters
const db: Shelter[] = demoMode === 'empty' ? [] : demoShelters

export const shelterApi = {
  list: (attempt = 0): Promise<Shelter[]> => fakeRequest(() => db, { attempt }),
}
