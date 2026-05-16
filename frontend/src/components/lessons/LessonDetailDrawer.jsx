import { useState } from 'react'
import {
  Drawer, Box, Typography, Divider, Chip, Avatar, Button,
  TextField, CircularProgress, IconButton, Link,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, FormControlLabel,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { addComment, applyLessonCredits, cancelLesson, rescheduleLesson } from '../../api/lessonsApi'
import dayjs from 'dayjs'

function nameLabel(u) {
  return `${u.first_nm || ''} ${u.last_nm || ''}`.trim() || u.email
}

export default function LessonDetailDrawer({
  lesson, currentUserId, isAdmin, onClose,
  onCommented, onEdit, onDelete, onCreditsApplied,
  onCancelled, onRescheduled,
}) {
  const [commentText, setCommentText] = useState('')
  const [saving, setSaving] = useState(false)
  const [applyingCredits, setApplyingCredits] = useState(false)
  const [creditError, setCreditError] = useState('')

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [notifyOnCancel, setNotifyOnCancel] = useState(false)

  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [rescheduleError, setRescheduleError] = useState('')
  const [notifyOnReschedule, setNotifyOnReschedule] = useState(false)
  const [newDate, setNewDate] = useState(null)

  if (!lesson) return null

  const isCreator = lesson.created_by === currentUserId
  const canEdit = isCreator
  const canDelete = isCreator || isAdmin
  const canApplyCredits = isCreator && !lesson.credits_applied && lesson.credit_cost > 0 && lesson.students?.length > 0
  const isCancelled = lesson.status === 'cancelled'
  const canCancel = (isCreator || isAdmin) && !isCancelled
  const canReschedule = (isCreator || isAdmin) && !isCancelled

  const handleApplyCredits = async () => {
    setCreditError('')
    setApplyingCredits(true)
    try {
      const updated = await applyLessonCredits(lesson.lesson_id)
      onCreditsApplied(updated)
    } catch (err) {
      setCreditError(err.response?.data?.error || 'Error applying credits.')
    } finally {
      setApplyingCredits(false)
    }
  }

  const handleComment = async () => {
    if (!commentText.trim()) return
    setSaving(true)
    try {
      const updated = await addComment(lesson.lesson_id, commentText)
      setCommentText('')
      onCommented(updated)
    } finally {
      setSaving(false)
    }
  }

  const handleOpenCancel = () => {
    setCancelError('')
    setNotifyOnCancel(false)
    setCancelOpen(true)
  }

  const handleCancel = async () => {
    setCancelling(true)
    setCancelError('')
    try {
      const updated = await cancelLesson(lesson.lesson_id, notifyOnCancel)
      setCancelOpen(false)
      onCancelled(updated)
    } catch (err) {
      setCancelError(err.response?.data?.error || 'Error cancelling lesson.')
    } finally {
      setCancelling(false)
    }
  }

  const handleOpenReschedule = () => {
    setRescheduleError('')
    setNotifyOnReschedule(false)
    setNewDate(dayjs(lesson.lesson_dt))
    setRescheduleOpen(true)
  }

  const handleReschedule = async () => {
    if (!newDate) return
    setRescheduling(true)
    setRescheduleError('')
    try {
      const updated = await rescheduleLesson(lesson.lesson_id, newDate.toISOString(), notifyOnReschedule)
      setRescheduleOpen(false)
      onRescheduled(updated)
    } catch (err) {
      setRescheduleError(err.response?.data?.error || 'Error rescheduling lesson.')
    } finally {
      setRescheduling(false)
    }
  }

  const commentLines = (lesson.comments || '')
    .split('\n')
    .filter(Boolean)

  return (
    <>
      <Drawer anchor="right" open={Boolean(lesson)} onClose={onClose}>
        <Box sx={{ width: 400, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" fontWeight={700}>{lesson.description}</Typography>
            <Box display="flex" alignItems="center">
              {canEdit && (
                <IconButton size="small" onClick={() => onEdit(lesson)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              {canDelete && (
                <IconButton size="small" color="error" onClick={() => onDelete(lesson)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </Box>
          </Box>

          {lesson.status && lesson.status !== 'scheduled' && (
            <Box mb={1}>
              <Chip
                label={isCancelled ? 'Cancelled' : 'Rescheduled'}
                color={isCancelled ? 'error' : 'warning'}
                size="small"
              />
            </Box>
          )}

          <Typography variant="caption" color="primary" fontWeight={600}>
            {dayjs(lesson.lesson_dt).format('dddd, MMMM D, YYYY [at] h:mm A')}
          </Typography>

          {(canCancel || canReschedule) && (
            <Box display="flex" gap={1} mt={1.5}>
              {canReschedule && (
                <Button size="small" color="warning" variant="outlined" onClick={handleOpenReschedule}>
                  Re-schedule
                </Button>
              )}
              {canCancel && (
                <Button size="small" color="error" variant="outlined" onClick={handleOpenCancel}>
                  Cancel Lesson
                </Button>
              )}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {lesson.assignment && (
            <>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Assignment</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>{lesson.assignment}</Typography>
            </>
          )}

          <Typography variant="subtitle2" fontWeight={600} mb={1}>Teachers</Typography>
          <Box display="flex" gap={0.5} flexWrap="wrap" mb={2}>
            {lesson.teachers?.map((t) => (
              <Chip
                key={t.user_id}
                avatar={<Avatar>{(t.first_nm?.[0] || '?')}</Avatar>}
                label={nameLabel(t)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>

          <Typography variant="subtitle2" fontWeight={600} mb={1}>Students</Typography>
          <Box display="flex" gap={0.5} flexWrap="wrap" mb={2}>
            {lesson.students?.length > 0
              ? lesson.students.map((s) => (
                  <Chip
                    key={s.user_id}
                    avatar={<Avatar>{(s.first_nm?.[0] || '?')}</Avatar>}
                    label={nameLabel(s)}
                    size="small"
                    variant="outlined"
                  />
                ))
              : <Typography variant="body2" color="text.secondary">No students</Typography>
            }
          </Box>

          {lesson.library_items?.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Library</Typography>
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {lesson.library_items.map((item) => (
                  <Link
                    key={item.library_id}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 14 }}
                  >
                    {item.title}
                    <OpenInNewIcon sx={{ fontSize: 13 }} />
                  </Link>
                ))}
              </Box>
            </>
          )}

          {lesson.credit_cost > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>Credits</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cost: {lesson.credit_cost} credit{lesson.credit_cost !== 1 ? 's' : ''} per student
                  </Typography>
                </Box>
                {lesson.credits_applied ? (
                  <Chip label="Applied" color="success" size="small" />
                ) : canApplyCredits ? (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleApplyCredits}
                    disabled={applyingCredits}
                  >
                    {applyingCredits ? <CircularProgress size={16} /> : 'Apply Credits'}
                  </Button>
                ) : null}
              </Box>
              {creditError && (
                <Typography variant="caption" color="error" display="block" mb={1}>
                  {creditError}
                </Typography>
              )}
            </>
          )}

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" fontWeight={600} mb={1}>Comments</Typography>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
            {commentLines.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No comments yet.</Typography>
            ) : (
              commentLines.map((line, i) => (
                <Typography key={i} variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                  {line}
                </Typography>
              ))
            )}
          </Box>

          <Box display="flex" gap={1}>
            <TextField
              placeholder="Add a comment..."
              size="small"
              fullWidth
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
            />
            <Button variant="contained" onClick={handleComment} disabled={saving || !commentText.trim()}>
              {saving ? <CircularProgress size={18} /> : 'Post'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Lesson</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel <strong>{lesson.description}</strong>?
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={notifyOnCancel}
                onChange={(e) => setNotifyOnCancel(e.target.checked)}
              />
            }
            label="Notify participants by email"
            sx={{ mt: 1, display: 'block' }}
          />
          {cancelError && (
            <Typography variant="caption" color="error" display="block" mt={1}>
              {cancelError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} disabled={cancelling}>Keep</Button>
          <Button color="error" variant="contained" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? <CircularProgress size={18} /> : 'Cancel Lesson'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule dialog */}
      <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Re-schedule Lesson</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="New date & time"
              value={newDate}
              onChange={setNewDate}
              slotProps={{ textField: { fullWidth: true, size: 'small', sx: { mt: 1 } } }}
            />
          </LocalizationProvider>
          <FormControlLabel
            control={
              <Checkbox
                checked={notifyOnReschedule}
                onChange={(e) => setNotifyOnReschedule(e.target.checked)}
              />
            }
            label="Notify participants by email"
            sx={{ mt: 1, display: 'block' }}
          />
          {rescheduleError && (
            <Typography variant="caption" color="error" display="block" mt={1}>
              {rescheduleError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleOpen(false)} disabled={rescheduling}>Cancel</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={handleReschedule}
            disabled={rescheduling || !newDate}
          >
            {rescheduling ? <CircularProgress size={18} /> : 'Re-schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
