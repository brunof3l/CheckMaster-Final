import Sidebar from '@/components/layout/Sidebar'
import PageContainer from '@/components/ui/PageContainer'
import PageTransition from '@/components/ui/PageTransition'
import { useAuthStore } from '@/store/auth'
import { useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const { pathname } = useLocation()
  const showSidebar = !!user && pathname !== '/login' && pathname !== '/register'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {showSidebar && <Sidebar className="hidden md:block h-screen sticky top-0" />}

      {showSidebar && (
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-30">
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-primary">CheckMaster</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2">
            <Menu />
          </button>
        </div>
      )}

      {showSidebar && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-background">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button onClick={() => setMobileMenuOpen(false)} className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <X className="text-white" />
              </button>
            </div>
            <Sidebar onClose={() => setMobileMenuOpen(false)} className="w-full h-full border-none" />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PageContainer>
          <PageTransition>{children}</PageTransition>
        </PageContainer>
      </div>
    </div>
  )
}
