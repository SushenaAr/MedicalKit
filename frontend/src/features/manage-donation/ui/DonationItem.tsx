import { Link } from 'react-router-dom'
import { Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material'
import {
  DonationChip,
  ExpiryChip,
  shelterAccepts,
  useMedicines,
  type Medicine,
} from '../../../entities/medicine/index.ts'
import { useShelters, type Shelter } from '../../../entities/shelter/index.ts'
import { routes } from '../../../shared/config/routes.ts'
import { useAction, type LoadStatus } from '../../../shared/lib/index.ts'

function shelterHint(status: LoadStatus, chosen: boolean): string | undefined {
  if (status === 'loading') return 'Загружаем приюты…'
  if (status === 'error') return 'Не удалось загрузить приюты'
  if (!chosen) return 'Выберите, куда отвезёте'
  return undefined
}

function shelterOption(shelter: Shelter, medicine: Medicine) {
  const accepts = shelterAccepts(shelter, medicine)
  return (
    <MenuItem key={shelter.id} value={shelter.id} disabled={!accepts}>
      {shelter.name}
      {!accepts && ` (нужен срок от ${shelter.minMonthsLeft} мес.)`}
    </MenuItem>
  )
}

/**
 * Строка списка на передачу: выбор приюта, отметка «передано», удаление из списка.
 * Приюты, которые не примут лекарство из-за остатка срока, недоступны для выбора.
 */
export function DonationItem({ medicine }: { medicine: Medicine }) {
  const { setDonationShelter, markHanded, cancelDonation } = useMedicines()
  const { shelters, status: sheltersStatus } = useShelters()
  const chooseShelter = useAction(setDonationShelter, { success: 'Приют выбран' })
  const handOver = useAction(markHanded, { success: `«${medicine.name}» отмечено переданным. Спасибо!` })
  const cancel = useAction(cancelDonation, { success: `«${medicine.name}» убрано из списка` })

  const donation = medicine.donation
  if (!donation) return null

  const handed = donation.status === 'handed'
  const shelter = shelters.find((s) => s.id === donation.shelterId)
  const busy = chooseShelter.pending || handOver.pending || cancel.pending
  const sheltersReady = sheltersStatus === 'success'

  return (
    <Card sx={{ transition: 'background-color 200ms ease', ...(handed && { bgcolor: 'action.hover' }) }}>
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            component={Link}
            to={routes.medicine(medicine.id)}
            sx={{ fontWeight: 600, color: 'inherit' }}
          >
            {medicine.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {[medicine.substance, medicine.quantity].filter(Boolean).join(' · ')}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <ExpiryChip expiresAt={medicine.expiresAt} />
            {handed && <DonationChip donation={donation} />}
          </Stack>
        </Box>

        {handed ? (
          <Typography color="text.secondary" sx={{ flex: 1 }}>
            {shelter?.name ?? 'Приют не указан'}
          </Typography>
        ) : (
          <>
            <TextField
              select
              size="small"
              label="Приют"
              value={sheltersReady ? (donation.shelterId ?? '') : ''}
              onChange={(e) => chooseShelter.run(medicine.id, e.target.value || null)}
              disabled={busy || !sheltersReady}
              helperText={shelterHint(sheltersStatus, Boolean(donation.shelterId))}
              sx={{ flex: 1, minWidth: 220 }}
            >
              {shelters.map((s) => shelterOption(s, medicine))}
            </TextField>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                disabled={!donation.shelterId || (busy && !handOver.pending)}
                loading={handOver.pending}
                onClick={() => handOver.run(medicine.id)}
              >
                Передано
              </Button>
              <Button
                color="inherit"
                disabled={busy && !cancel.pending}
                loading={cancel.pending}
                onClick={() => cancel.run(medicine.id)}
              >
                Убрать
              </Button>
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  )
}
