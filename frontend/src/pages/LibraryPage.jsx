import { useEffect, useState } from 'react'
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, IconButton, Button, TextField, InputAdornment,
  CircularProgress, Snackbar, Alert, Link,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { listLibrary, deleteLibraryItem } from '../api/libraryApi'
import { useAuth } from '../context/AuthContext'
import LibraryFormDialog from '../components/library/LibraryFormDialog'
import ConfirmDialog from '../components/common/ConfirmDialog'

export default function LibraryPage() {
  const { user, hasRole } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [snack, setSnack] = useState(null)

  const load = () => listLibrary().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const filtered = items.filter((it) => {
    const q = search.toLowerCase()
    return (
      it.title.toLowerCase().includes(q) ||
      it.link.toLowerCase().includes(q) ||
      (`${it.creator?.first_nm || ''} ${it.creator?.last_nm || ''}`).toLowerCase().includes(q)
    )
  })

  const canModify = (item) =>
    hasRole('Admin') || item.created_by === user?.user_id

  const handleSaved = () => {
    setFormOpen(false)
    setEditItem(null)
    setSnack({ severity: 'success', message: editItem ? 'Item updated.' : 'Item added.' })
    load()
  }

  const handleDelete = async () => {
    try {
      await deleteLibraryItem(deleteTarget.library_id)
      setSnack({ severity: 'success', message: 'Item deleted.' })
      setDeleteTarget(null)
      load()
    } catch (err) {
      setSnack({ severity: 'error', message: err.response?.data?.error || 'Error deleting item.' })
      setDeleteTarget(null)
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Library</Typography>
        <Button variant="contained" onClick={() => { setEditItem(null); setFormOpen(true) }}>
          + Add Item
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField
            placeholder="Search by title, link, or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: 340 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Link</TableCell>
                  <TableCell>Shared By</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.library_id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{item.title}</TableCell>
                    <TableCell>
                      <Link
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: 320 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.link}
                        </Box>
                        <OpenInNewIcon sx={{ fontSize: 14, flexShrink: 0 }} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      {item.creator
                        ? `${item.creator.first_nm || ''} ${item.creator.last_nm || ''}`.trim() || item.creator.email
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {canModify(item) && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => { setEditItem(item); setFormOpen(true) }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                      No library items found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <LibraryFormDialog
        open={formOpen}
        item={editItem}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Library Item"
        message={`Delete "${deleteTarget?.title}"? It will also be removed from any lessons that use it.`}
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
