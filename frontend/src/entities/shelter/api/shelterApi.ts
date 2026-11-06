import { request } from '../../../shared/api/index.ts'
import type { Shelter, ShelterKind } from '../model/types.ts'

interface ShelterDto {
  id: number
  name: string
  kind: ShelterKind
  address: string
  min_months_left: number
  categories: { id: number; name: string }[]
}

function fromDto(dto: ShelterDto): Shelter {
  return {
    id: String(dto.id),
    name: dto.name,
    kind: dto.kind,
    address: dto.address,
    accepts: dto.categories.map((c) => c.name),
    acceptsCategoryIds: dto.categories.map((c) => String(c.id)),
    minMonthsLeft: dto.min_months_left,
  }
}

export const shelterApi = {
  // Справочник приютов публичный, но запрос идёт с токеном — так же, как остальные
  list: async (): Promise<Shelter[]> => (await request<ShelterDto[]>('/shelters')).map(fromDto),
}
