import { useDrawer } from '../context/DrawerContext'
import UploadDrawer from './UploadDrawer'

export default function GlobalUploadDrawer() {
  const { uploadOpen, closeUpload } = useDrawer()
  if (!uploadOpen) return null
  return <UploadDrawer onClose={closeUpload} />
}