export type ShelterKind = 'animals' | 'people'

export const SHELTER_KIND_LABELS: Record<ShelterKind, string> = {
  animals: 'Для животных',
  people: 'Для людей',
}

export interface Shelter {
  id: string
  name: string
  kind: ShelterKind
  address: string
  /** Какие группы лекарств принимает приют (названия категорий) */
  accepts: string[]
  /** id принимаемых категорий; пустой список — приют принимает любые */
  acceptsCategoryIds: string[]
  /** Минимальный остаток срока годности, с которым принимают лекарства */
  minMonthsLeft: number
}
