import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import AddPattern from './pages/AddPattern'
import AddMaterial from './pages/AddMaterial'

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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
