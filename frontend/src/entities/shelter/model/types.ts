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
  /** Какие группы лекарств принимает приют */
  accepts: string[]
  /** Минимальный остаток срока годности, с которым принимают лекарства */
  minMonthsLeft: number
}
