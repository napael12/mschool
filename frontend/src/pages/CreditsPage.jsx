import { useEffect, useState } from 'react'
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, IconButton, Button, CircularProgress, Snackbar, Alert, Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import { getCredits } from '../api/creditsApi'
import { useAuth } from '../context/AuthContext'
import AddCreditsDialog from '../components/credits/AddCreditsDialog'

function nameOf(u) {
  return u ? `${u.first_nm || ''} ${u.last_nm || ''}`.trim() || u.email : '—'
}

function BalanceChip({ value }) {
  const color = value > 0 ? 'success' : value < 0 ? 'error' : 'default'
  return (
    <Chip
      label={value.toFixed(2)}
      size="small"
      color={color}
      variant={value === 0 ? 'outlined' : 'filled'}
      sx={{ fontWeight: 700, minWidth: 64 }}
    />
  )
}

export default function CreditsPage() {
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole('Admin')
  const isTeacher = hasRole('Teacher')

  const [credits, setCredits] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [defaultStudentId, setDefaultStudentId] = useState(null)
  const [defaultTeacherId, setDefaultTeacherId] = useState(null)
  const [snack, setSnack] = useState(null)

  const load = () => getCredits().then(setCredits).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdd = (studentId = null, teacherId = null) => {
    setDefaultStudentId(studentId)
    setDefaultTeacherId(teacherId)
    setDialogOpen(true)
  }

  const handleSaved = () => {
    setDialogOpen(false)
    setSnack({ severity: 'success', message: 'Credits updated.' })
    load()
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Credits</Typography>
        {(isAdmin || isTeacher) && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openAdd()}>
            Adjust Credits
          </Button>
        )}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {/* Admin sees both teacher and student columns */}
                  {isAdmin && <TableCell>Teacher</TableCell>}
                  {/* Teacher sees student column; student sees teacher column */}
                  {!isAdmin && <TableCell>{isTeacher ? 'Student' : 'Teacher'}</TableCell>}
                  <TableCell align="center">Balance</TableCell>
                  {(isAdmin || isTeacher) && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {credits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 3 : 2} align="center" sx={{ color: 'text.secondary' }}>
                      No credit records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  credits.map((c) => (
                    <TableRow key={`${c.teacher_id}-${c.student_id}`} hover>
                      {isAdmin && <TableCell>{nameOf(c.teacher)}</TableCell>}
                      {!isAdmin && (
                        <TableCell>
                          {nameOf(isTeacher ? c.student : c.teacher)}
                        </TableCell>
                      )}
                      {isAdmin && <TableCell>{nameOf(c.student)}</TableCell>}
                      <TableCell align="center">
                        <BalanceChip value={c.balance} />
                      </TableCell>
                      {(isAdmin || isTeacher) && (
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openAdd(c.student_id, isAdmin ? c.teacher_id : null)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <AddCreditsDialog
        open={dialogOpen}
        defaultStudentId={defaultStudentId}
        defaultTeacherId={defaultTeacherId}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack && <Alert severity={snack.severity}>{snack.message}</Alert>}
      </Snackbar>
    </Box>
  )
}
