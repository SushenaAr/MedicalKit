import { useMedicines, type Medicine } from '../../../entities/medicine/index.ts'
import { useAction } from '../../../shared/lib/index.ts'
import { MedicineForm } from './MedicineForm.tsx'

interface CreateMedicineFormProps {
  onCreated: (medicine: Medicine) => void
  onCancel: () => void
}

export function CreateMedicineForm({ onCreated, onCancel }: CreateMedicineFormProps) {
  const { create } = useMedicines()
  const { run } = useAction(create, {
    success: (medicine) => `«${medicine.name}» добавлено в аптечку`,
    onSuccess: onCreated,
  })

  return <MedicineForm submitLabel="Добавить" onSubmit={run} onCancel={onCancel} />
}
