import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { API } from '../api'
import { MEASUREMENTS } from '../constants/measurements'

const emptyForm = () => ({
  name: '',
  ...Object.fromEntries(MEASUREMENTS.map(([key]) => [key, ''])),
})

export default function AddMeasurementSet() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const measurements = {}
      for (const [key] of MEASUREMENTS) {
        const v = form[key]
        if (v !== '' && v != null) measurements[key] = parseFloat(v)
      }
      const res = await fetch(`${API}/api/projects/${id}/measurement-sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), measurements }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Error ${res.status}`)
      }
      setForm(emptyForm())
      setSaved(true)
      setTimeout(() => setSaved(false), 6000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col md:h-full gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-semibold">Add Measurements</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${id}`)}>
          ← Back
        </button>
      </div>

      <div className="bg-base-200 rounded-xl p-4 flex flex-col md:flex-1 md:min-h-0">
        {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

        <form onSubmit={handleSave} className="flex flex-col gap-4 md:h-full">
          <div className="form-control shrink-0">
            <label className="label"><span className="label-text font-medium">Designation <span className="text-error">*</span></span></label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="e.g. Ada — main costume"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>

          <div className="divider my-0 shrink-0" />

          <div className="flex flex-col gap-2 md:flex-1 md:min-h-0 overflow-y-auto">
            {MEASUREMENTS.map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <label className="flex-1 text-sm text-base-content/70">{label}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="input input-bordered input-sm w-24 text-right"
                  placeholder="cm"
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 shrink-0">
            <button
              type="submit"
              className={`btn ${saved ? 'btn-success' : 'btn-primary'} min-w-28`}
              disabled={saving || !form.name.trim()}
            >
              {saving
                ? <span className="loading loading-spinner loading-sm" />
                : saved
                  ? <><Check className="w-4 h-4" /> Saved</>
                  : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
