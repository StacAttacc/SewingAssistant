import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/project/current', label: 'Current Project' },
  { to: '/project/new', label: 'New Project' },
  { to: '/projects', label: 'Past Projects' },
]

export default function Sidebar({ open }) {
  return (
    <aside
      className={`
        flex flex-col gap-1 p-4 bg-base-200 min-h-screen transition-all duration-200
        ${open ? 'w-56' : 'w-0 overflow-hidden p-0'}
      `}
    >
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `btn btn-ghost justify-start ${isActive ? 'btn-active' : ''}`
          }
        >
          {label}
        </NavLink>
      ))}
    </aside>
  )
}
