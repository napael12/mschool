import { useEffect, useState } from 'react'
import { Calendar, dayjsLocalizer } from 'react-big-calendar'
import dayjs from 'dayjs'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  Box, Typography, Fab, CircularProgress, Snackbar, Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { listLessons, deleteLesson } from '../api/lessonsApi'
import { useAuth } from '../context/AuthContext'
import LessonFormDialog from '../components/lessons/LessonFormDialog'
import LessonDetailDrawer from '../components/lessons/LessonDetailDrawer'
import ConfirmDialog from '../components/common/ConfirmDialog'

const localizer = dayjsLocalizer(dayjs)

function lessonToEvent(lesson) {
  const start = new Date(lesson.lesson_dt)
  const end = dayjs(lesson.lesson_dt).add(1, 'hour').toDate()
  return {
    title: lesson.description || '(No title)',
    start,
    end,
    resource: lesson,
  }
}

export default function LessonsPage() {
  const { user, hasRole } = useAuth()
  const canCreate = hasRole('Admin', 'Teacher')

  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editLesson, setEditLesson] = useState(null)
  const [defaultDate, setDefaultDate] = useState(null)
  const [detailLesson, setDetailLesson] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [snack, setSnack] = useState(null)

  const load = () => listLessons().then(setLessons).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const events = lessons.map(lessonToEvent)

  // Click on an existing event → open detail drawer
  const handleSelectEvent = (event) => {
    setDetailLesson(event.resource)
  }

  // Click on an empty slot → open new lesson form pre-filled with that date
  const handleSelectSlot = ({ start }) => {
    if (!canCreate) return
    setEditLesson(null)
    setDefaultDate(start)
    setFormOpen(true)
  }

  const handleSaved = () => {
    setFormOpen(false)
    setEditLesson(null)
    setDefaultDate(null)
    load()
  }

  const handleLessonUpdated = (updated) => {
    setDetailLesson(updated)
    setLessons((prev) => prev.map((l) => (l.lesson_id === updated.lesson_id ? updated : l)))
  }

  const handleDeleteRequest = (lesson) => {
    setDetailLesson(null)
    setDeleteTarget(lesson)
  }

  const handleDelete = async () => {
    try {
      await deleteLesson(deleteTarget.lesson_id)
      setSnack({ severity: 'success', message: 'Lesson deleted.' })
      setDeleteTarget(null)
      load()
    } catch (err) {
      setSnack({ severity: 'error', message: err.response?.data?.error || 'Error deleting lesson.' })
      setDeleteTarget(null)
    }
  }

  // Color events by creator role
  const eventStyleGetter = (event) => {
    const lesson = event.resource
    const isCreator = lesson.created_by === user?.user_id
    return {
      style: {
        backgroundColor: isCreator ? '#5D87FF' : '#ECF2FF',
        borderRadius: 4,
        border: 'none',
        color: isCreator ? '#fff' : '#5D87FF',
        fontSize: 12,
        fontWeight: 600,
      },
    }
  }

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Lessons</Typography>

      <Box sx={{ height: 'calc(100vh - 220px)', minHeight: 500 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={canCreate}
          eventPropGetter={eventStyleGetter}
          popup
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
        />
      </Box>

      {canCreate && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 32, right: 32 }}
          onClick={() => { setEditLesson(null); setDefaultDate(null); setFormOpen(true) }}
        >
          <AddIcon />
        </Fab>
      )}

      <LessonFormDialog
        open={formOpen}
        lesson={editLesson}
        defaultDate={defaultDate}
        onClose={() => { setFormOpen(false); setEditLesson(null); setDefaultDate(null) }}
        onSaved={handleSaved}
      />

      <LessonDetailDrawer
        lesson={detailLesson}
        currentUserId={user?.user_id}
        isAdmin={hasRole('Admin')}
        onClose={() => setDetailLesson(null)}
        onCommented={handleLessonUpdated}
        onCreditsApplied={handleLessonUpdated}
        onEdit={(lesson) => { setDetailLesson(null); setEditLesson(lesson); setFormOpen(true) }}
        onDelete={handleDeleteRequest}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Lesson"
        message={`Delete "${deleteTarget?.description}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
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
