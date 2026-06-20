import AppSidebar from '../../components/layout/AppSidebar'
import PageBackground from '../../components/layout/PageBackground'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PageBackground />

      <div className="relative flex min-h-screen">
        <AppSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
