import { Alert, AlertTitle, Button } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Appear } from './Appear.tsx'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  title?: string
}

export function ErrorState({ message, onRetry, title = 'Не удалось загрузить данные' }: ErrorStateProps) {
  return (
    <Appear>
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
              Повторить
            </Button>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Appear>
  )
}
