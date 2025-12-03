import React, { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import Button from '@/components/ui/Button'

type Item = { id: string; label: string; checked: boolean; problem: boolean; notes: string }

export default function DefectsStep({ checklistId, initialItems = [], onPrev, onNext }: { checklistId: string; initialItems?: any[]; onPrev: () => void; onNext: () => void }) {
  const [items, setItems] = useState<Item[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const normalized: Item[] = (initialItems ?? []).map((it: any, idx: number) => ({
      id: it.id ?? it.key ?? `i-${idx}`,
      label: it.label ?? it.name ?? String(it),
      checked: !!(it.checked ?? it.ok),
      problem: !!it.problem,
      notes: it.notes ?? '',
    }))
    setItems(normalized)
  }, [initialItems])

  function toggleChecked(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)))
  }

  function toggleProblem(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, problem: !i.problem, checked: true } : i)))
  }

  function updateNote(id: string, notes: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)))
  }

  async function save() {
    setSaving(true)
    try {
      const payload = items.map((i) => ({ id: i.id, label: i.label, checked: !!i.checked, problem: !!i.problem, notes: i.notes || '' }))
      const { data: existing } = await supabase.from('checklists').select('items').eq('id', checklistId).single()
      const meta = (existing?.items?.meta ?? {}) as any
      const out = { meta, defects: payload }
      const { error } = await supabase.from('checklists').update({ items: out, updated_at: new Date() }).eq('id', checklistId)
      if (error) throw new Error(error.message)
      return true
    } catch (e: any) {
      console.error(e)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function next() {
    const ok = await save()
    if (ok) onNext()
  }

  return (
    <div className="animate-fade-slide-in space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((i) => (
          <div key={i.id} className={"p-3 border rounded bg-card transition-all " + (i.problem ? 'border-red-700/60 bg-red-500/5' : '')}>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={i.checked} onChange={() => toggleChecked(i.id)} className="transition-transform duration-150 ease-emphasis active:scale-[0.97]" />
              <span>{i.label}</span>
              <button onClick={() => toggleProblem(i.id)} className={(i.problem ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground') + ' px-2 py-1 text-xs rounded transition-transform duration-150 ease-emphasis active:scale-[0.97]'}>
                {i.problem ? 'Problema' : 'OK'}
              </button>
            </label>
            <textarea className="w-full mt-2 p-2 rounded bg-muted border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40" value={i.notes} onChange={(e) => updateNote(i.id, e.target.value)} placeholder="Observações" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <Button variant="ghost" onClick={onPrev}>Voltar</Button>
        <Button onClick={next} loading={saving} disabled={saving}>Avançar</Button>
      </div>
    </div>
  )
}

