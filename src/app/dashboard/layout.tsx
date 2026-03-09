import { UserButton } from '@clerk/nextjs'
import SidebarNav from './SidebarNav'
import './dashboard.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo">Autopilot</h1>
        </div>
        <SidebarNav />
        <div className="sidebar-footer">
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  )
}
