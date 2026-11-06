import { createContext } from 'react'

export type NotificationSeverity = 'success' | 'info' | 'warning' | 'error'

export interface Notification {
  message: string
  severity?: NotificationSeverity
}

export type Notify = (notification: Notification) => void

export const NotificationContext = createContext<Notify | null>(null)
