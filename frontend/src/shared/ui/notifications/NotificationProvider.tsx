import { useCallback, useState, type ReactNode, type SyntheticEvent } from 'react'
import { Alert, Slide, Snackbar, type SlideProps } from '@mui/material'
import { NotificationContext, type Notification } from './context.ts'

interface QueuedNotification extends Notification {
  key: number
}

function SlideUp(props: SlideProps) {
  return <Slide {...props} direction="up" />
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<QueuedNotification | null>(null)
  const [open, setOpen] = useState(false)

  const notify = useCallback((notification: Notification) => {
    setCurrent({ ...notification, key: Date.now() })
    setOpen(true)
  }, [])

  const handleClose = (_event?: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return
    setOpen(false)
  }

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar
        key={current?.key}
        open={open}
        autoHideDuration={current?.severity === 'error' ? 6000 : 3500}
        onClose={handleClose}
        slots={{ transition: SlideUp }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={current?.severity ?? 'success'}
          variant="filled"
          sx={{ width: '100%', alignItems: 'center' }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  )
}
