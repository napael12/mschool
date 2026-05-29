import { useEffect, useState } from 'react'
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, IconButton, Button, CircularProgress, Snackbar, Alert, Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import EmailIcon from '@mui/icons-material/Email'
import { getCredits } from '../api/creditsApi'
import { useAuth } from '../context/AuthContext'
import AddCreditsDialog from '../components/credits/AddCreditsDialog'
import AddStudentDialog from '../components/credits/AddStudentDialog'
import InviteStudentDialog from '../components/credits/InviteStudentDialog'

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
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false)
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [defaultStudentId, setDefaultStudentId] = useState(null)
  const [defaultTeacherId, setDefaultTeacherId] = useState(null)
  const [snack, setSnack] = useState(null)

  const load = () => getCredits().then(setCredits).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdjust = (studentId = null, teacherId = null) => {
    setDefaultStudentId(studentId)
    setDefaultTeacherId(teacherId)
    setCreditsDialogOpen(true)
  }

  const handleSaved = () => {
    setCreditsDialogOpen(false)
    setSnack({ severity: 'success', message: 'Credits updated.' })
    load()
  }

  const handleStudentAdded = (message) => {
    setAddStudentOpen(false)
    load()
    setSnack({ severity: 'success', message: message || 'Student added.' })
  }

  const handleInvited = (message) => {
    setInviteOpen(false)
    load()
    setSnack({ severity: 'success', message: message || 'Invitation sent.' })
  }

  const pageTitle = isAdmin ? 'Student/Credits' : isTeacher ? 'Students' : 'Credits'
  const colSpan = isAdmin ? 4 : isTeacher ? 3 : 2

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>{pageTitle}</Typography>
        <Box display="flex" gap={1}>
          {isTeacher && (
            <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setAddStudentOpen(true)}>
              Add Student
            </Button>
          )}
          {isTeacher && (
            <Button variant="outlined" startIcon={<EmailIcon />} onClick={() => setInviteOpen(true)}>
              Invite Student
            </Button>
          )}
          {(isAdmin || isTeacher) && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => openAdjust()}>
              Adjust Credits
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {isAdmin && <TableCell>Teacher</TableCell>}
                  {isAdmin && <TableCell>Student</TableCell>}
                  {!isAdmin && <TableCell>{isTeacher ? 'Student' : 'Teacher'}</TableCell>}
                  <TableCell align="center">Balance</TableCell>
                  {(isAdmin || isTeacher) && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {credits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} align="center" sx={{ color: 'text.secondary' }}>
                      No credit records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  credits.map((c) => (
                    <TableRow key={`${c.teacher_id}-${c.student_id}`} hover>
                      {isAdmin && <TableCell>{nameOf(c.teacher)}</TableCell>}
                      {isAdmin && <TableCell>{nameOf(c.student)}</TableCell>}
                      {!isAdmin && (
                        <TableCell>{nameOf(isTeacher ? c.student : c.teacher)}</TableCell>
                      )}
                      <TableCell align="center">
                        <BalanceChip value={c.balance} />
                      </TableCell>
                      {(isAdmin || isTeacher) && (
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openAdjust(c.student_id, isAdmin ? c.teacher_id : null)}
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
        open={creditsDialogOpen}
        defaultStudentId={defaultStudentId}
        defaultTeacherId={defaultTeacherId}
        onClose={() => setCreditsDialogOpen(false)}
        onSaved={handleSaved}
        allowedStudents={isTeacher ? credits.map((c) => c.student).filter(Boolean) : undefined}
      />

      <AddStudentDialog
        open={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        onAdded={handleStudentAdded}
      />

      <InviteStudentDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={handleInvited}
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
