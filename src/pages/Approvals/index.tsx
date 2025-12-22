import HeaderPage from '@/components/ui/HeaderPage'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useChecklistsList } from '@/hooks/useChecklists'
import { PageTransition } from '@/components/PageTransition'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { toast } from 'sonner'
import { Check, X, FileText, ExternalLink } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'

export default function Approvals() {
  const qc = useQueryClient()
  
  // Fetch only checklists waiting for approval
  const { data: checklists, isLoading } = useChecklistsList({ status: 'aguardando_aprovacao' })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('checklists').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklists'] })
      toast.success('Status atualizado com sucesso!')
    },
    onError: (err: any) => {
      toast.error('Erro ao atualizar status: ' + err.message)
    }
  })

  const getFileUrl = (path: string) => {
    return supabase.storage.from('checklists').getPublicUrl(path).data.publicUrl
  }

  if (isLoading) {
    return (
      <PageTransition>
        <HeaderPage title="Aprovações Pendentes" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
           {[1,2,3].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </PageTransition>
    )
  }

  if (!checklists || checklists.length === 0) {
    return (
      <PageTransition>
        <HeaderPage title="Aprovações Pendentes" />
        <Card className="p-8 text-center text-muted-foreground mt-4">
          Nenhum checklist aguardando aprovação.
        </Card>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <HeaderPage title="Aprovações Pendentes" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {checklists.map((item: any) => {
           const meta = item.items?.meta || {}
           const budgetTotal = meta.budget_total || 0
           const budgetFiles = item.budgetAttachments || []

           return (
             <Card key={item.id} className="p-4 flex flex-col justify-between gap-4 border-l-4 border-l-amber-500">
               <div>
                 <div className="flex justify-between items-start mb-2">
                   <Badge variant="warning">Aguardando</Badge>
                   <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                 </div>
                 
                 <div className="mb-4">
                    <h3 className="font-bold text-lg leading-tight mb-1">{item.vehicles?.plate || 'Sem Placa'}</h3>
                    <p className="text-sm text-muted-foreground">{item.suppliers?.trade_name || 'Sem Fornecedor'}</p>
                 </div>
                 
                 <div className="my-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                   <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Valor do Orçamento</p>
                   <p className="text-3xl font-bold text-emerald-600">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budgetTotal)}
                   </p>
                 </div>

                 {budgetFiles.length > 0 ? (
                   <div className="mb-4">
                     <p className="text-xs font-medium mb-2 text-muted-foreground uppercase">Anexos ({budgetFiles.length})</p>
                     <div className="flex flex-col gap-2">
                       {budgetFiles.map((file: any, idx: number) => (
                         <a 
                           key={idx} 
                           href={getFileUrl(file.path)}
                           target="_blank" 
                           rel="noreferrer"
                           className="text-sm flex items-center gap-2 text-primary hover:bg-primary/5 p-2 rounded transition-colors border border-border/50"
                         >
                           <FileText size={16} className="text-muted-foreground" /> 
                           <span className="truncate flex-1">{file.name || 'Anexo'}</span>
                           <ExternalLink size={12} className="opacity-50" />
                         </a>
                       ))}
                     </div>
                   </div>
                 ) : (
                    <div className="mb-4 text-sm text-muted-foreground italic">Sem anexos</div>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-border">
                 <Button 
                   variant="outline"
                   className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                   onClick={() => {
                     if(window.confirm('Tem certeza que deseja rejeitar este orçamento? O checklist voltará para rascunho.')) {
                        updateStatus.mutate({ id: item.id, status: 'rascunho' })
                     }
                   }}
                   disabled={updateStatus.isPending}
                 >
                   <X size={16} className="mr-2" /> Rejeitar
                 </Button>
                 <Button 
                   className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow"
                   onClick={() => {
                      if(window.confirm('Aprovar este orçamento e iniciar manutenção?')) {
                        updateStatus.mutate({ id: item.id, status: 'em_andamento' })
                      }
                   }}
                   disabled={updateStatus.isPending}
                 >
                   <Check size={16} className="mr-2" /> Aprovar
                 </Button>
               </div>
             </Card>
           )
        })}
      </div>
    </PageTransition>
  )
}
