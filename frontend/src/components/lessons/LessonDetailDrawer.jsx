import { useState } from 'react'
import {
  Drawer, Box, Typography, Divider, Chip, Avatar, Button,
  TextField, CircularProgress, IconButton, Link,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { addComment, applyLessonCredits } from '../../api/lessonsApi'
import dayjs from 'dayjs'

function nameLabel(u) {
  return `${u.first_nm || ''} ${u.last_nm || ''}`.trim() || u.email
}

export default function LessonDetailDrawer({ lesson, currentUserId, isAdmin, onClose, onCommented, onEdit, onDelete, onCreditsApplied }) {
  const [commentText, setCommentText] = useState('')
  const [saving, setSaving] = useState(false)
  const [applyingCredits, setApplyingCredits] = useState(false)
  const [creditError, setCreditError] = useState('')

  if (!lesson) return null

  const isCreator = lesson.created_by === currentUserId
  const canEdit = isCreator
  const canDelete = isCreator || isAdmin
  const canApplyCredits = isCreator && !lesson.credits_applied && lesson.credit_cost > 0 && lesson.students?.length > 0

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

  const commentLines = (lesson.comments || '')
    .split('\n')
    .filter(Boolean)

  return (
    <Drawer anchor="right" open={Boolean(lesson)} onClose={onClose}>
      <Box sx={{ width: 400, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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

        <Typography variant="caption" color="primary" fontWeight={600}>
          {dayjs(lesson.lesson_dt).format('dddd, MMMM D, YYYY [at] h:mm A')}
        </Typography>

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
  )
}
