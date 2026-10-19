import { Chip } from '@mui/material'
import { daysLeft, expiryStatus, pluralDays } from '../utils/expiry.ts'

const COLORS = { expired: 'error', soon: 'warning', ok: 'success' } as const

export default function ExpiryChip({ expiresAt }: { expiresAt: string }) {
  const days = daysLeft(expiresAt)
  const status = expiryStatus(days)

  let label: string
  if (status === 'expired') {
    label = `Просрочено ${-days} ${pluralDays(days)} назад`
  } else if (days === 0) {
    label = 'Истекает сегодня'
  } else {
    label = `Осталось ${days} ${pluralDays(days)}`
  }

  return (
    <Chip
      size="small"
      color={COLORS[status]}
      variant={status === 'ok' ? 'outlined' : 'filled'}
      label={label}
    />
  )
}
