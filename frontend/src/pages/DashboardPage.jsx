import { useEffect, useState } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import SchoolIcon from '@mui/icons-material/School'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { getSummary, getTeacherMetrics } from '../api/metricsApi'
import { listLessons } from '../api/lessonsApi'
import { useAuth } from '../context/AuthContext'
import dayjs from 'dayjs'

function StatCard({ title, value, icon, color }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            bgcolor: `${color}.lighter`,
            color: `${color}.dark`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700}>{value ?? '-'}</Typography>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('Admin')
  const [summary, setSummary] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetches = isAdmin
      ? [getSummary().then(setSummary), getTeacherMetrics().then(setTeachers)]
      : [listLessons().then(setLessons)]
    Promise.all(fetches).finally(() => setLoading(false))
  }, [isAdmin])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Dashboard
      </Typography>

      {isAdmin && summary && (
        <>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={4}>
              <StatCard title="Total Teachers" value={summary.total_teachers} icon={<SchoolIcon />} color="primary" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard title="Total Students" value={summary.total_students} icon={<PeopleIcon />} color="secondary" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard title="Total Lessons" value={summary.total_lessons} icon={<CalendarMonthIcon />} color="info" />
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Teacher Metrics</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Teacher</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell align="right">Lessons</TableCell>
                      <TableCell align="right">Students</TableCell>
                      <TableCell>First Lesson</TableCell>
                      <TableCell>Last Lesson</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teachers.map((t) => (
                      <TableRow key={t.user_id} hover>
                        <TableCell>{t.first_nm} {t.last_nm}</TableCell>
                        <TableCell>{t.email}</TableCell>
                        <TableCell align="right">{t.lesson_count}</TableCell>
                        <TableCell align="right">{t.student_count}</TableCell>
                        <TableCell>{t.first_lesson ? dayjs(t.first_lesson).format('MMM D, YYYY') : '-'}</TableCell>
                        <TableCell>{t.last_lesson ? dayjs(t.last_lesson).format('MMM D, YYYY') : '-'}</TableCell>
                      </TableRow>
                    ))}
                    {teachers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>No data</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {!isAdmin && (
        <>
          <Typography variant="h6" fontWeight={600} mb={2}>Upcoming Lessons</Typography>
          {lessons.length === 0 ? (
            <Typography color="text.secondary">No upcoming lessons.</Typography>
          ) : (
            <Grid container spacing={2}>
              {lessons
                .filter((l) => dayjs(l.lesson_dt).isAfter(dayjs()))
                .slice(0, 6)
                .map((l) => (
                  <Grid item xs={12} sm={6} md={4} key={l.lesson_id}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="primary">
                          {dayjs(l.lesson_dt).format('ddd, MMM D - h:mm A')}
                        </Typography>
                        <Typography fontWeight={600}>{l.description}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {l.assignment}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  )
}
