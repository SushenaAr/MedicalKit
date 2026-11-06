import { forwardRef, type ReactElement, type ReactNode, type Ref } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'

const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  /** Действие выполняется — кнопки заблокированы, на кнопке подтверждения индикатор */
  pending?: boolean
  danger?: boolean
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  pending = false,
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      slots={{ transition: SlideUp }}
      aria-labelledby="confirm-dialog-title"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Отмена
        </Button>
        <Button
          color={danger ? 'error' : 'primary'}
          variant="contained"
          onClick={onConfirm}
          loading={pending}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
