import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { signIn, signOut, getCurrentSession } from '@/services/auth'
import { getCurrentUserProfile, type DbUser } from '@/services/users'
import { supabase } from '@/config/supabase'

async function ensureProfile(session: Session | null): Promise<DbUser | null> {
  const uid = session?.user?.id
  if (!uid) return null
  try {
    const { data: profile, error: selError } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
    if (selError) console.warn('Falha ao buscar perfil, tentando autocriar:', selError.message)
    if (!profile) {
      const email = session?.user?.email ?? ''
      const name = (session?.user?.user_metadata as any)?.name || (email ? email.split('@')[0] : null)
      const { data: newProfile, error: insError } = await supabase
        .from('users')
        .insert({
          id: uid,
          email,
          name,
          created_at: new Date().toISOString(),
          role: 'user',
        })
        .select()
        .single()
      if (insError) {
        console.error('Erro fatal ao criar perfil:', insError)
        await supabase.auth.signOut()
        return null
      }
      return newProfile as DbUser
    }
    return profile as DbUser
  } catch (e: any) {
    console.error('Erro inesperado ao garantir perfil:', e?.message || e)
    await supabase.auth.signOut()
    return null
  }
}

type AuthState = {
  user: User | null
  profile: DbUser | null
  loading: boolean
  initFromSession: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  initFromSession: async () => {
    try {
      set({ loading: true })
      const session = await getCurrentSession()
      const user = session?.user ?? null
      const profile = user ? await ensureProfile(session) : null
      set({ user, profile, loading: false })
      const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
        const u = session?.user ?? null
        if (event === 'SIGNED_IN' || u) {
          const p = await ensureProfile(session)
          set({ user: u, profile: p })
        } else {
          set({ user: null, profile: null })
        }
      })
      return
    } catch {
      set({ user: null, profile: null, loading: false })
    }
  },
  login: async (email, password) => {
    set({ loading: true })
    const { session } = await signIn({ email, password })
    const user = session?.user ?? null
    const profile = await ensureProfile(session)
    set({ user, profile, loading: false })
  },
  logout: async () => {
    set({ loading: true })
    await signOut()
    set({ user: null, profile: null, loading: false })
  },
}))
