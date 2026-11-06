import { useCallback } from 'react'
import { Box, CircularProgress, FormControlLabel, Switch } from '@mui/material'
import { useMedicines, type Medicine } from '../../../entities/medicine/index.ts'
import { useAction } from '../../../shared/lib/index.ts'

/** Переключатель «Упаковка вскрыта» — сразу сохраняет изменение */
export function ToggleOpenedSwitch({ medicine }: { medicine: Medicine }) {
  const { update } = useMedicines()
  const setOpened = useCallback((opened: boolean) => update(medicine.id, { opened }), [update, medicine.id])
  const { run, pending } = useAction(setOpened, {
    success: (m) => (m.opened ? 'Упаковка отмечена вскрытой' : 'Отметка «вскрыто» снята'),
  })

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <FormControlLabel
        control={
          <Switch checked={medicine.opened} disabled={pending} onChange={(e) => run(e.target.checked)} />
        }
        label="Упаковка вскрыта"
      />
      {pending && <CircularProgress size={18} aria-label="Сохранение" />}
    </Box>
  )
}
