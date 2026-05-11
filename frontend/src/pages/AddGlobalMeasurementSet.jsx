import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { API } from '../api'
import { MEASUREMENTS } from '../constants/measurements'

const emptyForm = () => ({
  name: '',
  ...Object.fromEntries(MEASUREMENTS.map(([key]) => [key, ''])),
})

export default function AddGlobalMeasurementSet() {
  const { ms_id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!ms_id
  const [form, setForm] = useState(emptyForm())
  const [nameTouched, setNameTouched] = useState(false)
  const [invalidFields, setInvalidFields] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    fetch(`${API}/api/measurements`)
      .then(r => r.ok ? r.json() : [])
      .then(sets => {
        const ms = sets.find(s => s.id === Number(ms_id))
        if (ms) {
          setForm({
            name: ms.name,
            ...Object.fromEntries(
              MEASUREMENTS.map(([key]) => [key, ms.measurements[key] != null ? String(ms.measurements[key]) : ''])
            ),
          })
        }
      })
  }, [ms_id, isEdit])

  const nameError = nameTouched && !form.name.trim()
  const hasMeasurement = MEASUREMENTS.some(([key]) => form[key] !== '')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleMeasurementChange(key, value) {
    if (value !== '' && (isNaN(value) || Number(value) < 0)) return
    set(key, value)
    setInvalidFields(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }

  function handleMeasurementBlur(key, value) {
    if (value !== '' && (isNaN(value) || Number(value) < 0)) {
      setInvalidFields(prev => new Set([...prev, key]))
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setNameTouched(true)
    if (!form.name.trim() || !hasMeasurement || invalidFields.size > 0) return
    setSaving(true)
    setError(null)
    try {
      const measurements = {}
      for (const [key] of MEASUREMENTS) {
        const v = form[key]
        if (v !== '' && v != null) measurements[key] = parseFloat(v)
      }
      const url = isEdit ? `${API}/api/measurements/${ms_id}` : `${API}/api/measurements`
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), measurements }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Error ${res.status}`)
      }
      if (isEdit) {
        navigate('/measurements')
      } else {
        setForm(emptyForm())
        setNameTouched(false)
        setInvalidFields(new Set())
        setSaved(true)
        setTimeout(() => setSaved(false), 6000)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col md:h-full gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-semibold">{isEdit ? 'Edit Measurements' : 'Add Measurements'}</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/measurements')}>
          ← Back
        </button>
      </div>

      <div className="bg-base-200 rounded-xl p-4 flex flex-col md:flex-1 md:min-h-0">
        {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

        <form onSubmit={handleSave} className="flex flex-col gap-4 md:h-full">
          <div className="flex items-center gap-3 shrink-0">
            <label className="flex-1 text-sm text-base-content/70">
              Designation <span className="text-error">*</span>
            </label>
            <input
              type="text"
              className={`input input-bordered input-sm w-48 ${nameError ? 'input-error' : ''}`}
              placeholder="e.g. My measurements"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onBlur={() => setNameTouched(true)}
            />
          </div>
          {nameError && <p className="text-xs text-error text-right shrink-0 -mt-2">Name is required.</p>}

          <div className="divider my-0 shrink-0" />

          <div className="flex flex-col gap-2 md:flex-1 md:min-h-0 overflow-y-auto">
            {MEASUREMENTS.map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <label className="flex-1 text-sm text-base-content/70">{label}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className={`input input-bordered input-sm w-24 text-right ${invalidFields.has(key) ? 'input-error' : ''}`}
                  placeholder="cm"
                  value={form[key]}
                  onChange={e => handleMeasurementChange(key, e.target.value)}
                  onBlur={e => handleMeasurementBlur(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            className={`btn ${saved ? 'btn-success' : 'btn-primary'} w-full shrink-0`}
            disabled={saving || !hasMeasurement}
          >
            {saving
              ? <span className="loading loading-spinner loading-sm" />
              : saved
                ? <><Check className="w-4 h-4" /> Saved</>
                : isEdit ? 'Save' : 'Add'}
          </button>
        </form>
      </div>
    </div>
  )
}
