import { useLocation } from 'react-router-dom'

const crumbMap = {
  '/': 'Home',
  '/project/current': 'Current Project',
  '/project/new': 'New Project',
  '/projects': 'Past Projects',
}

export default function Navbar({ onToggleSidebar }) {
  const { pathname } = useLocation()
  const crumb = crumbMap[pathname] ?? 'Sewing Assistant'

  return (
    <nav className="navbar bg-base-100 border-b border-base-300 px-4 gap-4">
      <button
        className="btn btn-ghost btn-square"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="breadcrumbs text-sm">
        <ul>
          <li><span className="text-base-content/50">Sewing Assistant</span></li>
          <li className="font-medium">{crumb}</li>
        </ul>
      </div>
    </nav>
  )
}
