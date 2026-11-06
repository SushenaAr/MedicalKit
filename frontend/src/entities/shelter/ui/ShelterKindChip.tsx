import { Chip } from '@mui/material'
import PetsIcon from '@mui/icons-material/Pets'
import PeopleIcon from '@mui/icons-material/PeopleOutline'
import { SHELTER_KIND_LABELS, type ShelterKind } from '../model/types.ts'

export function ShelterKindChip({ kind }: { kind: ShelterKind }) {
  return (
    <Chip
      size="small"
      icon={kind === 'animals' ? <PetsIcon /> : <PeopleIcon />}
      label={SHELTER_KIND_LABELS[kind]}
    />
  )
}
