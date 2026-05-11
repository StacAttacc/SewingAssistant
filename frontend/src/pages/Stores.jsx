import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Phone, Globe, Clock, MapPin } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { API } from '../api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const MONTREAL = [45.5017, -73.5673]

function MapRecenter({ center }) {
  const map = useMap()
  if (center) map.setView(center, 12)
  return null
}

export default function Stores() {
  const [city, setCity] = useState('Montreal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stores, setStores] = useState([])
  const [mapCenter, setMapCenter] = useState(MONTREAL)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!city.trim()) return
    setLoading(true)
    setError(null)

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const geoData = await geoRes.json()
      if (!geoData.length) throw new Error(`City "${city}" not found.`)

      const lat = parseFloat(geoData[0].lat)
      const lon = parseFloat(geoData[0].lon)
      setMapCenter([lat, lon])

      const storesRes = await fetch(`${API}/api/stores/nearby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon, radius_m: 10000 }),
      })
      if (!storesRes.ok) throw new Error(`Server error ${storesRes.status}`)
      const data = await storesRes.json()
      setStores(data.stores)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  return (
    <div className="flex flex-col md:h-full gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-semibold">Find Fabric Stores</h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 shrink-0">
        <input
          type="text"
          className="input input-bordered flex-1"
          placeholder="City name…"
          value={city}
          onChange={e => setCity(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !city.trim()}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'Search'}
        </button>
      </form>

      {error && <div className="alert alert-error shrink-0"><span>{error}</span></div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:flex-1 md:min-h-0">

        {/* Store list — second on mobile, first on desktop */}
        <div className="bg-base-200 rounded-xl p-4 flex flex-col md:min-h-0 order-2 md:order-1">
          <p className="text-sm text-base-content/50 mb-3 shrink-0">
            {!searched
              ? 'Search a city to find nearby fabric & sewing stores.'
              : stores.length > 0
                ? `${stores.length} store${stores.length !== 1 ? 's' : ''} found within 10 km`
                : 'No stores found in this area.'}
          </p>
          <div className="md:flex-1 md:min-h-0 overflow-y-auto space-y-2 pr-1">
            {stores.map((store, i) => (
              <div key={i} className="bg-base-100 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{store.name}</p>
                    {store.address && store.address !== 'Address not available' && (
                      <p className="text-sm text-base-content/60 mt-0.5">{store.address}</p>
                    )}
                    {store.opening_hours && (
                      <div className="text-xs text-base-content/50 flex items-start gap-1 mt-1">
                        <Clock className="w-3 h-3 shrink-0 mt-0.5" />
                        <div>
                          {store.opening_hours.split(';').map(s => s.trim()).filter(Boolean).map((line, j) => (
                            <div key={j}>{line}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(store.phone || store.website) && (
                      <div className="flex gap-3 mt-2">
                        {store.phone && (
                          <a href={`tel:${store.phone}`} className="text-xs text-primary flex items-center gap-1 hover:underline">
                            <Phone className="w-3 h-3" /> {store.phone}
                          </a>
                        )}
                        {store.website && (
                          <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                            <Globe className="w-3 h-3" /> Website
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map — first on mobile, second on desktop */}
        <div className="rounded-xl overflow-hidden h-72 md:h-auto order-1 md:order-2">
          <MapContainer
            center={MONTREAL}
            zoom={12}
            className="w-full h-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapRecenter center={mapCenter} />
            {stores.map((store, i) =>
              store.lat && store.lon
                ? <Marker key={i} position={[store.lat, store.lon]}>
                    <Popup>
                      <strong>{store.name}</strong>
                      {store.address && store.address !== 'Address not available' && (
                        <><br />{store.address}</>
                      )}
                    </Popup>
                  </Marker>
                : null
            )}
          </MapContainer>
        </div>

      </div>
    </div>
  )
}
