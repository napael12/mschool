import { Box, Button, ButtonGroup, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const VIEWS = ['month', 'week', 'day', 'agenda']
const VIEW_LABELS = { month: 'Month', week: 'Week', day: 'Day', agenda: 'Agenda' }

export default function CalendarToolbar({ label, view, onNavigate, onView }) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      gap={1}
      mb={2}
    >
      {/* Navigation */}
      <Box display="flex" alignItems="center" gap={1}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => onNavigate('TODAY')}
          sx={{ minWidth: 64 }}
        >
          Today
        </Button>
        <ButtonGroup size="small" variant="outlined">
          <Button onClick={() => onNavigate('PREV')}><ChevronLeftIcon fontSize="small" /></Button>
          <Button onClick={() => onNavigate('NEXT')}><ChevronRightIcon fontSize="small" /></Button>
        </ButtonGroup>
      </Box>

      {/* Label */}
      <Typography variant="subtitle1" fontWeight={700} color="text.primary">
        {label}
      </Typography>

      {/* View selector */}
      <ButtonGroup size="small" variant="outlined">
        {VIEWS.map((v) => (
          <Button
            key={v}
            onClick={() => onView(v)}
            variant={view === v ? 'contained' : 'outlined'}
            disableElevation
          >
            {VIEW_LABELS[v]}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  )
}
