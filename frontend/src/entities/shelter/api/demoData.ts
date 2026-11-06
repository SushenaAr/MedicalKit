import type { Shelter } from '../model/types.ts'

export const demoShelters: Shelter[] = [
  {
    id: 's1',
    name: 'Приют для животных «Верный друг»',
    kind: 'animals',
    address: 'ул. Примерная, д. 12',
    accepts: ['Антисептики', 'Ранозаживляющие мази', 'Сорбенты', 'Перевязочные материалы'],
    minMonthsLeft: 3,
  },
  {
    id: 's2',
    name: 'Социальный центр «Тёплый дом»',
    kind: 'people',
    address: 'пр. Демонстрационный, д. 5',
    accepts: ['Жаропонижающие и обезболивающие', 'Антигистаминные', 'Средства от простуды'],
    minMonthsLeft: 1,
  },
  {
    id: 's3',
    name: 'Кризисный центр «Опора»',
    kind: 'people',
    address: 'ул. Тестовая, д. 8, корп. 2',
    accepts: ['Средства от простуды', 'Препараты для ЖКТ', 'Антисептики'],
    minMonthsLeft: 2,
  },
]
