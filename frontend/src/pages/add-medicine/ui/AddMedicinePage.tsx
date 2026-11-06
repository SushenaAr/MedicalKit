import { useNavigate } from 'react-router-dom'
import { CreateMedicineForm } from '../../../features/medicine-form/index.ts'
import { routes } from '../../../shared/config/routes.ts'
import { Appear, PageHeader } from '../../../shared/ui/index.ts'

export function AddMedicinePage() {
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Добавить лекарство"
        subtitle="Внесите данные с упаковки. Поля со звёздочкой обязательны"
      />
      <Appear>
        <CreateMedicineForm
          onCreated={(medicine) => navigate(routes.medicine(medicine.id))}
          onCancel={() => navigate(routes.medicines())}
        />
      </Appear>
    </>
  )
}
