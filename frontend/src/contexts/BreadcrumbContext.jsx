import { createContext, useContext, useState } from 'react'

const BreadcrumbContext = createContext(null)

export function BreadcrumbProvider({ children }) {
  const [crumb, setCrumb] = useState(null)
  return (
    <BreadcrumbContext.Provider value={{ crumb, setCrumb }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext)
}
