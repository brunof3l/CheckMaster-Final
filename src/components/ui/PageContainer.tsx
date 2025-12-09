export default function PageContainer({ children }: { children: React.ReactNode }) {
  return <main className="flex-1 p-4 md:p-6">{children}</main>
}

