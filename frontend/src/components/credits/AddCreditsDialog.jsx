import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Alert, Box, Typography,
} from '@mui/material'
import { adjustCredits } from '../../api/creditsApi'
import { listParticipants } from '../../api/usersApi'
import { useAuth } from '../../context/AuthContext'

export default function AddCreditsDialog({ open, defaultStudentId, defaultTeacherId, onClose, onSaved }) {
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole('Admin')

  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [teacherId, setTeacherId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [action, setAction] = useState('add')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    listParticipants().then((users) => {
      setTeachers(users.filter((u) => u.profile === 'Teacher'))
      setStudents(users.filter((u) => u.profile === 'Student'))
    })
    setTeacherId(defaultTeacherId || (isAdmin ? '' : user?.user_id) || '')
    setStudentId(defaultStudentId || '')
    setAction('add')
    setAmount('')
    setError('')
  }, [open, defaultStudentId, defaultTeacherId])

  const handleSave = async () => {
    const amt = parseFloat(amount)
    if (!studentId) { setError('Please select a student.'); return }
    if (isAdmin && !teacherId) { setError('Please select a teacher.'); return }
    if (!amount || isNaN(amt) || amt <= 0) { setError('Enter a positive amount.'); return }

    setSaving(true)
    try {
      const payload = {
        student_id: parseInt(studentId),
        amount: action === 'add' ? amt : -amt,
        ...(isAdmin && { teacher_id: parseInt(teacherId) }),
      }
      await adjustCredits(payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error adjusting credits.')
    } finally {
      setSaving(false)
    }
  }

  const selectedStudent = students.find((s) => s.user_id === parseInt(studentId))
  const selectedTeacher = isAdmin
    ? teachers.find((t) => t.user_id === parseInt(teacherId))
    : user

  const nameOf = (u) => u ? `${u.first_nm || ''} ${u.last_nm || ''}`.trim() || u.email : ''

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Adjust Credits</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        {isAdmin && (
          <TextField
            select
            label="Teacher"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            fullWidth
          >
            {teachers.map((t) => (
              <MenuItem key={t.user_id} value={t.user_id}>{nameOf(t)}</MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          select
          label="Student"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          fullWidth
        >
          {students.map((s) => (
            <MenuItem key={s.user_id} value={s.user_id}>{nameOf(s)}</MenuItem>
          ))}
        </TextField>

        <Box display="flex" gap={1}>
          <TextField
            select
            label="Action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            sx={{ width: 130 }}
          >
            <MenuItem value="add">Add</MenuItem>
            <MenuItem value="deduct">Deduct</MenuItem>
          </TextField>
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 0, step: 0.5 }}
            fullWidth
          />
        </Box>

        {selectedStudent && selectedTeacher && amount && !isNaN(parseFloat(amount)) && (
          <Typography variant="caption" color="text.secondary">
            {action === 'add' ? 'Adding' : 'Deducting'} {parseFloat(amount)} credit(s)
            {action === 'add' ? ' to ' : ' from '} {nameOf(selectedStudent)}
            {isAdmin ? ` (teacher: ${nameOf(selectedTeacher)})` : ''}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Apply'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
