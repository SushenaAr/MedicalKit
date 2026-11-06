import { useState } from 'react'
import { Button } from '@mui/material'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import { useMedicines, type Medicine } from '../../../entities/medicine/index.ts'
import { useAction } from '../../../shared/lib/index.ts'
import { ConfirmDialog } from '../../../shared/ui/index.ts'

interface DeleteMedicineButtonProps {
  medicine: Medicine
  onDeleted: () => void
}

/** Удаление лекарства с подтверждением */
export function DeleteMedicineButton({ medicine, onDeleted }: DeleteMedicineButtonProps) {
  const { remove } = useMedicines()
  const [open, setOpen] = useState(false)
  const { run, pending } = useAction(remove, {
    success: `«${medicine.name}» удалено из аптечки`,
    onSuccess: onDeleted,
  })

  return (
    <>
      <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setOpen(true)}>
        Удалить из аптечки
      </Button>
      <ConfirmDialog
        open={open}
        title={`Удалить «${medicine.name}»?`}
        description={
          medicine.donation
            ? 'Лекарство пропадёт из аптечки и из списка на передачу.'
            : 'Лекарство пропадёт из аптечки. Это действие нельзя отменить.'
        }
        confirmLabel="Удалить"
        danger
        pending={pending}
        onConfirm={async () => {
          if (!(await run(medicine.id))) setOpen(false)
        }}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
