import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button, Fade, Grid, Typography } from '@mui/material'
import { TransitionGroup } from 'react-transition-group'
import MedicationIcon from '@mui/icons-material/MedicationOutlined'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import { MedicineCard, MedicineCardSkeleton, useMedicines } from '../../../entities/medicine/index.ts'
import {
  applyFilters,
  countByStatus,
  hasActiveFilters,
  MedicineFiltersBar,
  useMedicineFilters,
} from '../../../features/medicine-filters/index.ts'
import { routes } from '../../../shared/config/routes.ts'
import { EmptyState, ErrorState, PageHeader } from '../../../shared/ui/index.ts'

const CARD_SIZE = { xs: 12, sm: 6, lg: 4 } as const

export function MedicinesPage() {
  const { medicines, status, error, reload } = useMedicines()
  const { filters, setFilters, resetFilters } = useMedicineFilters()

  const visible = useMemo(() => applyFilters(medicines, filters), [medicines, filters])
  const counts = useMemo(() => countByStatus(medicines, filters.query), [medicines, filters.query])

  const addButton = (
    <Button variant="contained" component={Link} to={routes.newMedicine()}>
      Добавить лекарство
    </Button>
  )

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <Grid container spacing={2} aria-busy="true" aria-label="Загрузка списка">
          {Array.from({ length: 6 }, (_, i) => (
            <Grid key={i} size={CARD_SIZE}>
              <MedicineCardSkeleton />
            </Grid>
          ))}
        </Grid>
      )
    }
    if (status === 'error' && error) {
      return <ErrorState message={error} onRetry={reload} />
    }
    if (medicines.length === 0) {
      return (
        <EmptyState
          icon={<MedicationIcon />}
          title="Аптечка пуста"
          description="Добавьте лекарства, которые есть дома, чтобы следить за сроками годности."
          action={addButton}
        />
      )
    }
    return (
      <>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }} aria-live="polite">
          {hasActiveFilters(filters)
            ? `Найдено: ${visible.length} из ${medicines.length}`
            : `Всего: ${medicines.length}`}
        </Typography>
        {visible.length === 0 && (
          <EmptyState
            icon={<SearchOffIcon />}
            title="Ничего не найдено"
            description="Попробуйте изменить запрос или выбрать другой статус."
            action={<Button onClick={resetFilters}>Сбросить фильтры</Button>}
          />
        )}
        {/* Карточки плавно появляются и исчезают при смене фильтра или поиска */}
        <Grid container spacing={2}>
          <TransitionGroup component={null} appear>
            {visible.map((m) => (
              <Fade key={m.id} timeout={{ appear: 300, enter: 300, exit: 150 }}>
                <Grid size={CARD_SIZE}>
                  <MedicineCard medicine={m} />
                </Grid>
              </Fade>
            ))}
          </TransitionGroup>
        </Grid>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Моя аптечка"
        subtitle="Все лекарства с поиском и фильтром по сроку годности"
        action={addButton}
      />
      <MedicineFiltersBar
        filters={filters}
        counts={counts}
        onChange={setFilters}
        disabled={status !== 'success' || medicines.length === 0}
      />
      {renderContent()}
    </>
  )
}
