import { Link } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'

export default function NotFoundPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        404
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Такой страницы нет.
      </Typography>
      <Button variant="contained" component={Link} to="/">
        На главную
      </Button>
    </Box>
  )
}
