import { Chip } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import type { Donation } from '../model/types.ts'

export function DonationChip({ donation }: { donation: Donation }) {
  return donation.status === 'handed' ? (
    <Chip size="small" color="success" icon={<CheckIcon />} label="Передано в приют" />
  ) : (
    <Chip size="small" color="secondary" variant="outlined" label="В списке «отдать»" />
  )
}
