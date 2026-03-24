import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, MapPin } from 'lucide-react'

export default function Landing() {
  const [recentProject, setRecentProject] = useState(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/projects/')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (data.length > 0) {
          const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          setRecentProject(sorted[0])
        }
      })
  }, [])

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-2xl font-semibold">Welcome to Sewing Assistant</h1>

      <div className="flex flex-col gap-3">
        {recentProject && (
          <Link
            to={`/projects/${recentProject.id}`}
            className="card bg-base-200 border border-base-300 hover:border-primary transition-colors"
          >
            <div className="card-body py-4 px-5">
              <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Continue working on</p>
              <p className="font-semibold text-lg leading-tight">{recentProject.name}</p>
              {recentProject.description && (
                <p className="text-sm text-base-content/60 line-clamp-2 mt-1">{recentProject.description}</p>
              )}
            </div>
          </Link>
        )}

        <Link to="/projects" className="card bg-base-200 border border-base-300 hover:border-primary transition-colors">
          <div className="card-body py-4 px-5 flex-row items-center gap-3">
            <FolderOpen className="w-5 h-5 text-primary shrink-0" />
            <span className="font-medium">All projects</span>
          </div>
        </Link>

        <Link to="/stores" className="card bg-base-200 border border-base-300 hover:border-primary transition-colors">
          <div className="card-body py-4 px-5 flex-row items-center gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <span className="font-medium">Find fabric stores</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
