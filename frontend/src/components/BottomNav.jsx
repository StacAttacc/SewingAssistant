import { NavLink } from 'react-router-dom'
import { House, FolderOpen, MapPin, Ruler } from 'lucide-react'

const links = [
  { to: '/', label: 'Home', Icon: House },
  { to: '/projects', label: 'Projects', Icon: FolderOpen },
  { to: '/measurements', label: 'Measurements', Icon: Ruler },
  { to: '/stores', label: 'Stores', Icon: MapPin },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-base-100 border-t border-base-300">
      {links.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs transition-colors ${
              isActive ? 'text-primary' : 'text-base-content/60'
            }`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
