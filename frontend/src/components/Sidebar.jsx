import { NavLink } from 'react-router-dom'
import { House, FolderOpen } from 'lucide-react'

const links = [
  { to: '/', label: 'Home', Icon: House },
  { to: '/projects', label: 'Projects', Icon: FolderOpen },
]

export default function Sidebar({ open }) {
  return (
    <aside
      className={`
        flex flex-col gap-1 py-4 bg-base-200 min-h-screen shrink-0
        transition-all duration-200
        ${open ? 'w-56 px-4' : 'w-15 px-2'}
      `}
    >
      {links.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          title={!open ? label : undefined}
          className={({ isActive }) =>
            `btn btn-ghost justify-start gap-3 px-2 ${isActive ? 'btn-active' : ''}`
          }
        >
          <Icon size={20} className="shrink-0" />
          {open && <span>{label}</span>}
        </NavLink>
      ))}
    </aside>
  )
}
