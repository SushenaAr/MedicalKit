import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { SHELTER_KIND_LABELS, type ShelterKind } from '../../../entities/shelter/index.ts'

export type ShelterKindFilterValue = 'all' | ShelterKind

interface ShelterKindFilterProps {
  value: ShelterKindFilterValue
  onChange: (value: ShelterKindFilterValue) => void
  disabled?: boolean
}

const OPTIONS: ShelterKindFilterValue[] = ['all', 'people', 'animals']

/** Фильтр приютов по тому, кому они помогают */
export function ShelterKindFilter({ value, onChange, disabled = false }: ShelterKindFilterProps) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      color="primary"
      value={value}
      disabled={disabled}
      onChange={(_, next: ShelterKindFilterValue | null) => next && onChange(next)}
      sx={{ mb: 3, flexWrap: 'wrap' }}
    >
      {OPTIONS.map((option) => (
        <ToggleButton key={option} value={option} sx={{ textTransform: 'none', px: 2 }}>
          {option === 'all' ? 'Все приюты' : SHELTER_KIND_LABELS[option]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
