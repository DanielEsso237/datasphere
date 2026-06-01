import { createContext, useContext, useState } from 'react'

const DrawerContext = createContext(null)

export function DrawerProvider({ children }) {
  const [uploadOpen, setUploadOpen] = useState(false)

  const openUpload  = () => setUploadOpen(true)
  const closeUpload = () => setUploadOpen(false)

  return (
    <DrawerContext.Provider value={{ uploadOpen, openUpload, closeUpload }}>
      {children}
    </DrawerContext.Provider>
  )
}

export const useDrawer = () => useContext(DrawerContext)