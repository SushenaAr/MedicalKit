import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Box, Card, CardContent, Collapse, Skeleton, Stack, Typography } from '@mui/material'
import { TransitionGroup } from 'react-transition-group'
import DonateIcon from '@mui/icons-material/VolunteerActivismOutlined'
import {
  byExpiry,
  DONATE_MIN_DAYS,
  ExpiryChip,
  isDonationSuggested,
  isHanded,
  isPlanned,
  useMedicines,
  type Medicine,
} from '../../../entities/medicine/index.ts'
import { DonationItem, PlanDonationButton } from '../../../features/manage-donation/index.ts'
import { routes } from '../../../shared/config/routes.ts'
import { EmptyState, ErrorState, PageHeader } from '../../../shared/ui/index.ts'

function SuggestionItem({ medicine }: { medicine: Medicine }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography
            component={Link}
            to={routes.medicine(medicine.id)}
            sx={{ fontWeight: 600, color: 'inherit' }}
          >
            {medicine.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[medicine.substance, medicine.quantity].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
        <ExpiryChip expiresAt={medicine.expiresAt} />
        <PlanDonationButton medicine={medicine} compact variant="text" />
      </CardContent>
    </Card>
  )
}

/**
 * Анимированный список: элементы плавно раскрываются при появлении и сворачиваются при удалении —
 * например, рекомендация исчезает из одного списка и появляется в списке на передачу.
 */
function AnimatedList({ items, render }: { items: Medicine[]; render: (medicine: Medicine) => ReactNode }) {
  return (
    <TransitionGroup>
      {items.map((m) => (
        <Collapse key={m.id} timeout={250}>
          <Box sx={{ pb: 1.5 }}>{render(m)}</Box>
        </Collapse>
      ))}
    </TransitionGroup>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ mb: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <Stack spacing={1.5}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={84} />
      ))}
    </Stack>
  )
}

export function DonatePage() {
  const { medicines, status, error, reload } = useMedicines()

  const sorted = [...medicines].sort(byExpiry)
  const suggested = sorted.filter(isDonationSuggested)
  const planned = sorted.filter(isPlanned)
  const handed = sorted.filter(isHanded)

  const header = (
    <>
      <PageHeader
        title="Отдать до срока"
        subtitle="Нераспечатанные лекарства, которые вам не понадобятся, лучше передать в приют, пока они годны"
      />
      <Alert severity="info" sx={{ mb: 3 }}>
        Приюты принимают только лекарства в целой упаковке и с остатком срока годности не меньше{' '}
        {DONATE_MIN_DAYS} дней. У каждого приюта свои требования — смотрите раздел{' '}
        <Link to={routes.shelters()}>«Приюты»</Link>.
      </Alert>
    </>
  )

  if (status === 'loading') {
    return (
      <>
        {header}
        <Section title="Рекомендуем отдать">
          <ListSkeleton rows={2} />
        </Section>
        <Section title="Список на передачу">
          <ListSkeleton rows={1} />
        </Section>
      </>
    )
  }

  if (status === 'error' && error) {
    return (
      <>
        {header}
        <ErrorState message={error} onRetry={reload} />
      </>
    )
  }

  return (
    <>
      {header}

      <Section title={`Рекомендуем отдать (${suggested.length})`}>
        <Collapse in={suggested.length === 0}>
          <Typography color="text.secondary">
            Подходящих лекарств нет: сюда попадают невскрытые лекарства, у которых осталось от 1 до 6 месяцев.
          </Typography>
        </Collapse>
        <AnimatedList items={suggested} render={(m) => <SuggestionItem medicine={m} />} />
      </Section>

      <Section title={`Список на передачу (${planned.length})`}>
        <Collapse in={planned.length === 0}>
          <EmptyState
            dense
            icon={<DonateIcon />}
            title="Список пуст"
            description="Добавьте лекарства из рекомендаций выше или из карточки лекарства."
          />
        </Collapse>
        <AnimatedList items={planned} render={(m) => <DonationItem medicine={m} />} />
      </Section>

      <Collapse in={handed.length > 0}>
        <Section title={`Уже передано (${handed.length})`}>
          <AnimatedList items={handed} render={(m) => <DonationItem medicine={m} />} />
        </Section>
      </Collapse>
    </>
  )
}
