import { Chip } from '@mui/material'
import { pluralDays } from '../../../shared/lib/index.ts'
import { daysLeft, expiryStatus } from '../model/expiry.ts'

const COLORS = { expired: 'error', soon: 'warning', ok: 'success' } as const

export function ExpiryChip({ expiresAt }: { expiresAt: string }) {
  const days = daysLeft({ expiresAt })
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
