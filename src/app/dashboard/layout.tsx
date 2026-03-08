import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
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
        <nav className="sidebar-nav">
          <Link href="/dashboard" className="nav-link active">
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          <Link href="/dashboard/compose" className="nav-link">
            <span className="nav-icon">✍️</span>
            Compose
          </Link>
          <Link href="/dashboard/schedule" className="nav-link">
            <span className="nav-icon">📅</span>
            Schedule
          </Link>
          <Link href="/dashboard/connections" className="nav-link">
            <span className="nav-icon">🔗</span>
            Connections
          </Link>
          <Link href="/dashboard/ai" className="nav-link">
            <span className="nav-icon">🤖</span>
            AI Writer
          </Link>
        </nav>
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
