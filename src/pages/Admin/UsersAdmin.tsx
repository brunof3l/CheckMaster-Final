import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import DataTable, { Column } from '@/components/ui/DataTable'
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listUsers, setUserRole, disableUser, resetPassword, type AdminUser } from '@/services/adminUsers'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/config/supabase'

export default function UsersAdmin() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const me = useAuthStore((s) => s.user)
  const isMe = (u: AdminUser) => me?.id === u.id
  const { data, isLoading } = useQuery({ queryKey: ['admin-users', search], queryFn: () => listUsers(search) })
  const disable = useMutation({ mutationFn: (u: AdminUser) => disableUser(u.id), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }) })

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário permanentemente? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.rpc('delete_user_by_admin', {
        target_user_id: userId
      });

      if (error) throw error;

      toast.success('Usuário excluído do banco de dados com sucesso!');
      
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const actionText = newRole === 'admin' ? 'tornar admin' : 'remover admin';

    if (!window.confirm(`Tem certeza que deseja ${actionText} este usuário?`)) return;

    try {
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;

      toast.success(`Usuário agora é ${newRole}!`);
      
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error('Erro ao alterar papel: ' + error.message);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!window.confirm(`Enviar email de redefinição de senha para ${email}?`)) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });

      if (error) throw error;

      toast.success(`Email de redefinição enviado para ${email}`);
    } catch (error: any) {
      toast.error('Erro ao enviar reset: ' + error.message);
    }
  };


  const columns: Column<AdminUser>[] = useMemo(
    () => [
      { key: 'name', header: 'Nome', render: (u) => u.name ?? '-' },
      { key: 'email', header: 'E-mail' },
      {
        key: 'role',
        header: 'Papel',
        render: (u) => (
          <Badge variant={u.role === 'admin' ? 'success' : u.role === 'user' ? 'default' : 'destructive'}>{u.role === 'disabled' ? 'desativado' : u.role}</Badge>
        ),
      },
      { key: 'created_at', header: 'Criado em', render: (u) => new Date(u.created_at).toLocaleString('pt-BR') },
      {
        key: 'actions',
        header: 'Ações',
        render: (u) => (
          <div className="flex gap-2">
            {u.role === 'user' && (
              <Button
                onClick={() => handleToggleAdmin(u.id, u.role)}
                disabled={isMe(u)}
              >
                Tornar admin
              </Button>
            )}
            {u.role === 'admin' && (
              <Button
                onClick={() => handleToggleAdmin(u.id, u.role)}
                disabled={isMe(u)}
              >
                Remover admin
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => handleResetPassword(u.email)}
            >
              Resetar senha
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleDeleteUser(u.id)}
              disabled={isMe(u) || loading}
            >
              Excluir
            </Button>
          </div>
        ),
      },
    ],
    [disable.mutateAsync, search]
  )

  return (
    <div className="space-y-4">
      <HeaderPage title="Administração de usuários" />
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Buscar por nome ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="mt-4 overflow-x-auto">
          <DataTable columns={columns} data={(data ?? []) as any} />
        </div>

      </Card>
    </div>
  )
}
