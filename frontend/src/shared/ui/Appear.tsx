import type { ReactNode } from 'react'
import { Box, keyframes, type SxProps, type Theme } from '@mui/material'

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
`

interface AppearProps {
  children: ReactNode
  /** Порядковый номер элемента в списке — для поочерёдного появления */
  index?: number
  sx?: SxProps<Theme>
}

/**
 * Плавное появление элемента при монтировании.
 * Чтобы анимация повторилась (например, при смене фильтра), смените `key` у элемента.
 * При системной настройке «уменьшить движение» анимация отключается.
 */
export function Appear({ children, index = 0, sx }: AppearProps) {
  return (
    <Box
      sx={[
        {
          height: '100%',
          animation: `${fadeInUp} 280ms ease-out both`,
          animationDelay: `${Math.min(index, 10) * 40}ms`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  )
}
