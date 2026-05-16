import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Autocomplete, Chip, Typography, CircularProgress, Box,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { createLesson, updateLesson } from '../../api/lessonsApi'
import { listParticipants } from '../../api/usersApi'
import { listLibrary } from '../../api/libraryApi'

const emptyForm = {
  lesson_dt: dayjs().add(1, 'day').startOf('hour'),
  description: '',
  assignment: '',
  credit_cost: 0,
  teacher_ids: [],
  student_ids: [],
  library_ids: [],
}

export default function LessonFormDialog({ open, lesson, defaultDate, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm)
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [libraryItems, setLibraryItems] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Fetch fresh participant and library lists every time the dialog opens
  useEffect(() => {
    if (!open) return
    setLoadingUsers(true)
    Promise.all([listParticipants(), listLibrary()])
      .then(([users, lib]) => {
        setTeachers(users.filter((u) => u.profile === 'Teacher'))
        setStudents(users.filter((u) => u.profile === 'Student'))
        setLibraryItems(lib)
      })
      .finally(() => setLoadingUsers(false))
  }, [open])

  // Pre-fill form when editing, reset when creating
  useEffect(() => {
    if (!open) return
    if (lesson) {
      setForm({
        lesson_dt: dayjs(lesson.lesson_dt),
        description: lesson.description || '',
        assignment: lesson.assignment || '',
        credit_cost: lesson.credit_cost ?? 0,
        teacher_ids: lesson.teachers?.map((t) => t.user_id) || [],
        student_ids: lesson.students?.map((s) => s.user_id) || [],
        library_ids: lesson.library_items?.map((l) => l.library_id) || [],
      })
    } else {
      setForm({ ...emptyForm, lesson_dt: defaultDate ? dayjs(defaultDate) : emptyForm.lesson_dt })
    }
    setError('')
  }, [lesson, defaultDate, open])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.description.trim()) { setError('Description is required.'); return }
    setSaving(true)
    try {
      const payload = {
        lesson_dt: form.lesson_dt.toISOString(),
        description: form.description,
        assignment: form.assignment,
        credit_cost: parseFloat(form.credit_cost) || 0,
        teacher_ids: form.teacher_ids,
        student_ids: form.student_ids,
        library_ids: form.library_ids,
      }
      if (lesson) {
        await updateLesson(lesson.lesson_id, payload)
      } else {
        await createLesson(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving lesson.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{lesson ? 'Edit Lesson' : 'New Lesson'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {loadingUsers ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <DateTimePicker
                  label="Date & Time"
                  value={form.lesson_dt}
                  onChange={(v) => setForm((f) => ({ ...f, lesson_dt: v }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  required
                  value={form.description}
                  onChange={set('description')}
                  inputProps={{ maxLength: 60 }}
                  error={!!error && !form.description.trim()}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Assignment"
                  fullWidth
                  multiline
                  rows={3}
                  value={form.assignment}
                  onChange={set('assignment')}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Credit Cost"
                  type="number"
                  fullWidth
                  value={form.credit_cost}
                  onChange={(e) => setForm((f) => ({ ...f, credit_cost: e.target.value }))}
                  inputProps={{ min: 0, step: 0.5 }}
                  helperText="Credits deducted per student when applied"
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={teachers}
                  getOptionLabel={(o) => `${o.first_nm || ''} ${o.last_nm || ''}`.trim() || o.email}
                  isOptionEqualToValue={(o, v) => o.user_id === v.user_id}
                  value={teachers.filter((t) => form.teacher_ids.includes(t.user_id))}
                  onChange={(_, val) => setForm((f) => ({ ...f, teacher_ids: val.map((t) => t.user_id) }))}
                  renderTags={(val, getTagProps) =>
                    val.map((o, i) => (
                      <Chip
                        key={o.user_id}
                        label={`${o.first_nm || ''} ${o.last_nm || ''}`.trim() || o.email}
                        size="small"
                        {...getTagProps({ index: i })}
                      />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} label="Teachers" />}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={students}
                  getOptionLabel={(o) => `${o.first_nm || ''} ${o.last_nm || ''}`.trim() || o.email}
                  isOptionEqualToValue={(o, v) => o.user_id === v.user_id}
                  value={students.filter((s) => form.student_ids.includes(s.user_id))}
                  onChange={(_, val) => setForm((f) => ({ ...f, student_ids: val.map((s) => s.user_id) }))}
                  renderTags={(val, getTagProps) =>
                    val.map((o, i) => (
                      <Chip
                        key={o.user_id}
                        label={`${o.first_nm || ''} ${o.last_nm || ''}`.trim() || o.email}
                        size="small"
                        {...getTagProps({ index: i })}
                      />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} label="Students" />}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={libraryItems}
                  getOptionLabel={(o) => o.title}
                  isOptionEqualToValue={(o, v) => o.library_id === v.library_id}
                  value={libraryItems.filter((l) => form.library_ids.includes(l.library_id))}
                  onChange={(_, val) => setForm((f) => ({ ...f, library_ids: val.map((l) => l.library_id) }))}
                  renderTags={(val, getTagProps) =>
                    val.map((o, i) => (
                      <Chip key={o.library_id} label={o.title} size="small" {...getTagProps({ index: i })} />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} label="Library Items" />}
                />
              </Grid>
              {error && (
                <Grid item xs={12}>
                  <Typography color="error" variant="body2">{error}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || loadingUsers}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}
