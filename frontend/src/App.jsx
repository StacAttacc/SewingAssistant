import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import CurrentProject from './pages/CurrentProject'
import NewProject from './pages/NewProject'
import PastProjects from './pages/PastProjects'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="project/current" element={<CurrentProject />} />
          <Route path="project/new" element={<NewProject />} />
          <Route path="projects" element={<PastProjects />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
