import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  Grid,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import MedicineCard from '../components/MedicineCard.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { useMedicines } from '../store/useMedicines.ts'
import { byExpiry, statusOf, type ExpiryStatus } from '../utils/expiry.ts'

type Filter = 'all' | ExpiryStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'ok', label: 'В порядке' },
  { value: 'soon', label: 'Скоро истекают' },
  { value: 'expired', label: 'Просрочены' },
]

function parseFilter(value: string | null): Filter {
  return FILTERS.some((f) => f.value === value) ? (value as Filter) : 'all'
}

export default function MedicinesPage() {
  const { medicines } = useMedicines()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const filter = parseFilter(searchParams.get('status'))

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    return medicines
      .filter((m) => filter === 'all' || statusOf(m) === filter)
      .filter(
        (m) =>
          !text ||
          m.name.toLowerCase().includes(text) ||
          m.substance.toLowerCase().includes(text) ||
          m.location.toLowerCase().includes(text),
      )
      .sort(byExpiry)
  }, [medicines, filter, query])

  const changeFilter = (value: Filter | null) => {
    if (!value) return
    setSearchParams(value === 'all' ? {} : { status: value })
  }

  return (
    <>
      <PageHeader
        title="Моя аптечка"
        subtitle="Все лекарства, отсортированные по сроку годности"
        action={
          <Button variant="contained" component={Link} to="/medicines/new">
            Добавить лекарство
          </Button>
        }
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Название, вещество или место хранения"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: '1 1 260px' }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          color="primary"
          value={filter}
          onChange={(_, value: Filter | null) => changeFilter(value)}
          sx={{ flexWrap: 'wrap' }}
        >
          {FILTERS.map((f) => (
            <ToggleButton key={f.value} value={f.value} sx={{ textTransform: 'none', px: 2 }}>
              {f.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {visible.length === 0 ? (
        <Typography color="text.secondary">Ничего не найдено.</Typography>
      ) : (
        <Grid container spacing={2}>
          {visible.map((m) => (
            <Grid key={m.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <MedicineCard medicine={m} />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  )
}
