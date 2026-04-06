import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert,
} from '@mui/material'
import { createLibraryItem, updateLibraryItem } from '../../api/libraryApi'

const empty = { title: '', link: '' }

export default function LibraryFormDialog({ open, item, onClose, onSaved }) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(item ? { title: item.title, link: item.link } : empty)
    setError('')
  }, [item, open])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.title.trim() || !form.link.trim()) {
      setError('Title and link are required.')
      return
    }
    setSaving(true)
    try {
      if (item) {
        await updateLibraryItem(item.library_id, form)
      } else {
        await createLibraryItem(form)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving item.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{item ? 'Edit Library Item' : 'Add Library Item'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Title"
          fullWidth
          required
          value={form.title}
          onChange={set('title')}
          inputProps={{ maxLength: 200 }}
        />
        <TextField
          label="Link (URL)"
          fullWidth
          required
          value={form.link}
          onChange={set('link')}
          inputProps={{ maxLength: 2000 }}
          placeholder="https://..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
