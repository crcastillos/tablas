import { useEffect, useState } from 'react'
import { Alert, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material'
import { useAppContext } from '../../context/AppContext'
import { householdsApi } from '../../api/households.api'
import type { HouseholdMember } from '../../types/domain'
import { EmptyState, LoadingState, PageHeader } from '../../components/ui/States'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { HouseholdRole } from '../../types/domain'
import { householdRoleLabel } from '../../utils/labels'
import { canManageMembers } from '../../utils/permissions'

export default function MembersPage() {
  const { activeHousehold } = useAppContext()
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const canManage = activeHousehold ? canManageMembers(activeHousehold.role, true) : false

  const load = async () => {
    if (!activeHousehold) return
    setLoading(true)
    try {
      setMembers(await householdsApi.members(activeHousehold.id))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [activeHousehold?.id])

  const addMember = async () => {
    if (!activeHousehold) return
    try {
      await householdsApi.addMember(activeHousehold.id, email, HouseholdRole.Member, false, false)
      setEmail('')
      setMessage('Integrante agregado.')
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (!activeHousehold) return <EmptyState title="Seleccione un hogar" />
  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader title="Integrantes del hogar" />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}
      {canManage ? (
        <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField label="Correo del usuario" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button variant="contained" onClick={() => void addMember()}>Agregar integrante</Button>
        </Paper>
      ) : null}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Activo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.displayName}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{householdRoleLabel(member.role)}</TableCell>
                <TableCell>{member.isActive ? 'Sí' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  )
}
