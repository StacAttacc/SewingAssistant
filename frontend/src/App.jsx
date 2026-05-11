import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import AddPattern from './pages/AddPattern'
import AddMaterial from './pages/AddMaterial'
import AddMeasurementSet from './pages/AddMeasurementSet'
import MyMeasurements from './pages/MyMeasurements'
import AddGlobalMeasurementSet from './pages/AddGlobalMeasurementSet'
import Stores from './pages/Stores'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="projects/:id/patterns/add" element={<AddPattern />} />
          <Route path="projects/:id/materials/add" element={<AddMaterial />} />
          <Route path="projects/:id/measurements/add" element={<AddMeasurementSet />} />
          <Route path="projects/:id/measurements/:ms_id/edit" element={<AddMeasurementSet />} />
          <Route path="measurements" element={<MyMeasurements />} />
          <Route path="measurements/add" element={<AddGlobalMeasurementSet />} />
          <Route path="measurements/:ms_id/edit" element={<AddGlobalMeasurementSet />} />
          <Route path="stores" element={<Stores />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
