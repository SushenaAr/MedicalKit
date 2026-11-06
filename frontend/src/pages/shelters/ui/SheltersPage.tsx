import { useState } from 'react'
import { Alert, Grid, Typography } from '@mui/material'
import HomeWorkIcon from '@mui/icons-material/HomeWorkOutlined'
import { canDonate, shelterAccepts, useMedicines } from '../../../entities/medicine/index.ts'
import {
  ShelterCard,
  ShelterCardSkeleton,
  useShelters,
  type Shelter,
} from '../../../entities/shelter/index.ts'
import { ShelterKindFilter, type ShelterKindFilterValue } from '../../../features/shelter-filter/index.ts'
import { Appear, EmptyState, ErrorState, PageHeader } from '../../../shared/ui/index.ts'

const CARD_SIZE = { xs: 12, md: 6, lg: 4 } as const

/** Сколько лекарств пользователя связано с приютом и сколько ещё он мог бы принять */
function ShelterStats({ shelter }: { shelter: Shelter }) {
  const { medicines, status } = useMedicines()
  if (status !== 'success') return null

  const assigned = medicines.filter((m) => m.donation?.shelterId === shelter.id).length
  const suitable = medicines.filter((m) => !m.donation && canDonate(m) && shelterAccepts(shelter, m)).length

  return (
    <>
      <Typography variant="body2">
        Ваших лекарств для этого приюта: <b>{assigned}</b>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Ещё подходят по сроку: {suitable}
      </Typography>
    </>
  )
}

export function SheltersPage() {
  const { shelters, status, error, reload } = useShelters()
  const [kind, setKind] = useState<ShelterKindFilterValue>('all')

  const visible = shelters.filter((s) => kind === 'all' || s.kind === kind)

  let content
  if (status === 'loading') {
    content = (
      <Grid container spacing={2}>
        {[0, 1, 2].map((i) => (
          <Grid key={i} size={CARD_SIZE}>
            <ShelterCardSkeleton />
          </Grid>
        ))}
      </Grid>
    )
  } else if (status === 'error' && error) {
    content = <ErrorState message={error} onRetry={reload} />
  } else if (visible.length === 0) {
    content = (
      <EmptyState
        icon={<HomeWorkIcon />}
        title={shelters.length === 0 ? 'Приютов пока нет' : 'Нет приютов этого типа'}
        description={
          shelters.length === 0 ? 'Список приютов появится здесь, когда они будут добавлены.' : undefined
        }
      />
    )
  } else {
    content = (
      <Grid container spacing={2}>
        {visible.map((shelter, index) => (
          // key включает фильтр, чтобы карточки заново плавно появлялись при его смене
          <Grid key={`${kind}-${shelter.id}`} size={CARD_SIZE}>
            <Appear index={index}>
              <ShelterCard shelter={shelter} footer={<ShelterStats shelter={shelter} />} />
            </Appear>
          </Grid>
        ))}
      </Grid>
    )
  }

  return (
    <>
      <PageHeader title="Приюты" subtitle="Куда можно передать лекарства и что там принимают" />
      <Alert severity="warning" sx={{ mb: 3 }}>
        Список приютов демонстрационный. Перед поездкой уточняйте потребности приюта.
      </Alert>
      <ShelterKindFilter
        value={kind}
        onChange={setKind}
        disabled={status !== 'success' || shelters.length === 0}
      />
      {content}
    </>
  )
}
