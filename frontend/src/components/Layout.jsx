import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { BreadcrumbProvider } from '../contexts/BreadcrumbContext'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <BreadcrumbProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar open={sidebarOpen} />
          <main className="flex-1 p-6 flex flex-col overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  )
}
