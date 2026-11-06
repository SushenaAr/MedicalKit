import {
  Box,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Close'
import { EXPIRY_STATUS_LABELS } from '../../../entities/medicine/index.ts'
import {
  SORT_LABELS,
  STATUS_FILTERS,
  type MedicineFilters,
  type SortOrder,
  type StatusFilter,
} from '../model/filters.ts'

interface MedicineFiltersBarProps {
  filters: MedicineFilters
  counts: Record<StatusFilter, number>
  onChange: (change: Partial<MedicineFilters>) => void
  disabled?: boolean
}

const statusLabel = (status: StatusFilter) => (status === 'all' ? 'Все' : EXPIRY_STATUS_LABELS[status])

export function MedicineFiltersBar({ filters, counts, onChange, disabled = false }: MedicineFiltersBarProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
      <TextField
        size="small"
        placeholder="Название, вещество или место хранения"
        value={filters.query}
        onChange={(e) => onChange({ query: e.target.value })}
        disabled={disabled}
        sx={{ flex: '1 1 260px' }}
        slotProps={{
          htmlInput: { 'aria-label': 'Поиск лекарств' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: filters.query && (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Очистить поиск" onClick={() => onChange({ query: '' })}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        select
        size="small"
        label="Сортировка"
        value={filters.sort}
        onChange={(e) => onChange({ sort: e.target.value as SortOrder })}
        disabled={disabled}
        sx={{ minWidth: 200 }}
      >
        {(Object.keys(SORT_LABELS) as SortOrder[]).map((sort) => (
          <MenuItem key={sort} value={sort}>
            {SORT_LABELS[sort]}
          </MenuItem>
        ))}
      </TextField>
      <ToggleButtonGroup
        size="small"
        exclusive
        color="primary"
        value={filters.status}
        onChange={(_, value: StatusFilter | null) => value && onChange({ status: value })}
        disabled={disabled}
        sx={{ flexWrap: 'wrap' }}
      >
        {STATUS_FILTERS.map((status) => (
          <ToggleButton key={status} value={status} sx={{ textTransform: 'none', px: 2 }}>
            {statusLabel(status)}
            {!disabled && (
              <Box component="span" sx={{ ml: 0.75, opacity: 0.7 }}>
                {counts[status]}
              </Box>
            )}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  )
}
