'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard',             label: 'Dashboard',    icon: '📊', exact: true },
  { href: '/dashboard/compose',     label: 'Compose',      icon: '✍️' },
  { href: '/dashboard/schedule',    label: 'Schedule',     icon: '📅' },
  { href: '/dashboard/camera-roll', label: 'Camera Roll',  icon: '📸' },
  { href: '/dashboard/connections', label: 'Connections',  icon: '🔗' },
  { href: '/dashboard/ai',          label: 'AI Writer',    icon: '🤖' },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="sidebar-nav">
      {links.map(({ href, label, icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link key={href} href={href} className={`nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
