import { Link, useLocation } from 'react-router-dom'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'

const crumbMap = {
  '/': 'Home',
  '/projects': 'Projects',
  '/stores': 'Stores',
}

export default function Navbar({ onToggleSidebar }) {
  const { pathname } = useLocation()
  const { crumb } = useBreadcrumb()
  const projectIdMatch = pathname.match(/\/projects\/(\d+)/)
  const projectId = projectIdMatch?.[1]
  const isAddPattern = /\/projects\/\d+\/patterns\/add/.test(pathname)
  const isAddMaterial = /\/projects\/\d+\/materials\/add/.test(pathname)
  const isProjectDetail = !!projectId && !isAddPattern && !isAddMaterial

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
          {isAddPattern ? (
            <>
              <li><Link to="/projects">Projects</Link></li>
              {crumb && <li><Link to={`/projects/${projectId}`}>{crumb}</Link></li>}
              <li className="font-medium">Add Pattern</li>
            </>
          ) : isAddMaterial ? (
            <>
              <li><Link to="/projects">Projects</Link></li>
              {crumb && <li><Link to={`/projects/${projectId}`}>{crumb}</Link></li>}
              <li className="font-medium">Add Material</li>
            </>
          ) : isProjectDetail ? (
            <>
              <li><Link to="/projects">Projects</Link></li>
              {crumb && <li className="font-medium">{crumb}</li>}
            </>
          ) : (
            <li className="font-medium">{crumbMap[pathname] ?? 'Sewing Assistant'}</li>
          )}
        </ul>
      </div>
    </nav>
  )
}
