import { useEffect, useState } from 'react'
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, CircularProgress, Chip,
} from '@mui/material'
import dayjs from 'dayjs'
import { getVisits } from '../api/metricsApi'

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
}

function nameOf(u) {
  if (!u) return '—'
  return `${u.first_nm || ''} ${u.last_nm || ''}`.trim() || u.email
}

const ROLE_COLOR = { Admin: 'error', Teacher: 'primary', Student: 'success' }

export default function VisitsPage() {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getVisits().then(setVisits).finally(() => setLoading(false))
  }, [])

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>User Visits</Typography>

      <Card>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Login Time</TableCell>
                  <TableCell>Last Seen</TableCell>
                  <TableCell>Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                      No visits recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  visits.map((v) => (
                    <TableRow key={v.visit_id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{nameOf(v.user)}</TableCell>
                      <TableCell>{v.user?.email || '—'}</TableCell>
                      <TableCell>
                        {v.user?.profile && (
                          <Chip
                            label={v.user.profile}
                            size="small"
                            color={ROLE_COLOR[v.user.profile] || 'default'}
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>{dayjs(v.login_at).format('MMM D, YYYY h:mm A')}</TableCell>
                      <TableCell>{dayjs(v.last_seen_at).format('MMM D, YYYY h:mm A')}</TableCell>
                      <TableCell>{formatDuration(v.duration_seconds)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  )
}
