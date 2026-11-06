import { Button, type ButtonProps } from '@mui/material'
import DonateIcon from '@mui/icons-material/VolunteerActivismOutlined'
import AddIcon from '@mui/icons-material/Add'
import { canDonate, useMedicines, type Medicine } from '../../../entities/medicine/index.ts'
import { useAction } from '../../../shared/lib/index.ts'

interface PlanDonationButtonProps {
  medicine: Medicine
  /** Компактная кнопка для списков рекомендаций */
  compact?: boolean
  variant?: ButtonProps['variant']
}

/** Добавить лекарство в список «отдать до срока» */
export function PlanDonationButton({
  medicine,
  compact = false,
  variant = 'contained',
}: PlanDonationButtonProps) {
  const { planDonation } = useMedicines()
  const { run, pending } = useAction(planDonation, {
    success: `«${medicine.name}» добавлено в список на передачу`,
  })

  return (
    <Button
      variant={variant}
      startIcon={compact ? <AddIcon /> : <DonateIcon />}
      disabled={!canDonate(medicine) || Boolean(medicine.donation)}
      loading={pending}
      loadingPosition="start"
      onClick={() => run(medicine.id)}
    >
      {compact ? 'В список' : 'Добавить в список «отдать»'}
    </Button>
  )
}
