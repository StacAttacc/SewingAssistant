export default function ProjectFormModal({
  dialogRef,
  mode = 'create',
  name, setName,
  desc, setDesc,
  budget, setBudget,
  loading,
  error,
  onSubmit,
  globalSets = [],
  selectedGlobalSets,
  setSelectedGlobalSets,
}) {
  const isEdit = mode === 'edit'

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-md">
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
          onClick={() => dialogRef.current?.close()}
        >✕</button>
        <h3 className="font-bold text-lg mb-5">{isEdit ? 'Edit Project' : 'New Project'}</h3>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Project name <span className="text-error">*</span></span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="e.g. Spring collection 2026"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              placeholder="What are you making?"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Budget</span>
            </label>
            <label className="input input-bordered w-full flex items-center gap-2">
              <span className="text-base-content/40 text-sm select-none">$</span>
              <input
                type="number"
                className="grow"
                placeholder="0.00"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                min="0"
                step="0.01"
              />
            </label>
          </div>

          {!isEdit && globalSets.length > 0 && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Include your measurements</span>
              </label>
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                {globalSets.map(gs => (
                  <label key={gs.id} className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selectedGlobalSets.has(gs.id)}
                      onChange={e => setSelectedGlobalSets(prev => {
                        const next = new Set(prev)
                        e.target.checked ? next.add(gs.id) : next.delete(gs.id)
                        return next
                      })}
                    />
                    <span className="text-sm">{gs.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2">
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  )
}
