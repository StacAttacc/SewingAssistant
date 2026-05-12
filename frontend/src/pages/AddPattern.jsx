import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useBreadcrumb } from '../contexts/BreadcrumbContext'
import { API } from '../api'
import ScrapeSection from '../components/pattern/ScrapeSection'
import UploadSection from '../components/pattern/UploadSection'
import ManualSection from '../components/pattern/ManualSection'
import GenerateSection from '../components/pattern/GenerateSection'

export default function AddPattern() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { setCrumb } = useBreadcrumb()
  const [activeTab, setActiveTab] = useState('search')

  useEffect(() => {
    fetch(`${API}/api/projects/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCrumb(data.name) })
    return () => setCrumb(null)
  }, [id, setCrumb])

  async function savePattern(body) {
    const res = await fetch(`${API}/api/projects/${id}/patterns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || `Error ${res.status}`)
    }
    return res.json()
  }

  return (
    <div className="flex flex-col md:h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-semibold">Add Pattern</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}`)}>
          ← Back
        </button>
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-border shrink-0">
        <button role="tab" className={`tab ${activeTab === 'search' ? 'tab-active' : ''}`} onClick={() => setActiveTab('search')}>Search</button>
        <button role="tab" className={`tab ${activeTab === 'upload' ? 'tab-active' : ''}`} onClick={() => setActiveTab('upload')}>Upload</button>
        <button role="tab" className={`tab ${activeTab === 'url' ? 'tab-active' : ''}`} onClick={() => setActiveTab('url')}>URL</button>
        <button role="tab" className={`tab ${activeTab === 'generate' ? 'tab-active' : ''}`} onClick={() => setActiveTab('generate')}>Generate</button>
      </div>

      {/* Tab content */}
      {activeTab === 'search' && (
        <div className="bg-base-200 rounded-xl p-4 flex flex-col md:flex-1 md:min-h-0">
          <ScrapeSection projectId={id} onSave={savePattern} />
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="bg-base-200 rounded-xl p-4 overflow-y-auto md:flex-1">
          <UploadSection projectId={id} onDone={() => navigate(`/projects/${id}`)} />
        </div>
      )}

      {activeTab === 'url' && (
        <div className="bg-base-200 rounded-xl p-4 overflow-y-auto md:flex-1">
          <ManualSection onSave={savePattern} onDone={() => navigate(`/projects/${id}`)} />
        </div>
      )}

      {activeTab === 'generate' && (
        <GenerateSection projectId={id} onDone={() => navigate(`/projects/${id}`)} />
      )}
    </div>
  )
}
