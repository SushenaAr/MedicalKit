import { useCallback } from 'react'
import { useMedicines, type Medicine, type MedicineInput } from '../../../entities/medicine/index.ts'
import { useAction } from '../../../shared/lib/index.ts'
import { valuesFromMedicine } from '../model/validation.ts'
import { MedicineForm } from './MedicineForm.tsx'

interface EditMedicineFormProps {
  medicine: Medicine
  onSaved: (medicine: Medicine) => void
  onCancel: () => void
}

export function EditMedicineForm({ medicine, onSaved, onCancel }: EditMedicineFormProps) {
  const { update } = useMedicines()
  const save = useCallback((input: MedicineInput) => update(medicine.id, input), [update, medicine.id])
  const { run } = useAction(save, { success: 'Изменения сохранены', onSuccess: onSaved })

  return (
    <MedicineForm
      initialValues={valuesFromMedicine(medicine)}
      submitLabel="Сохранить"
      onSubmit={run}
      onCancel={onCancel}
      inDonationList={medicine.donation?.status === 'planned'}
    />
  )
}
