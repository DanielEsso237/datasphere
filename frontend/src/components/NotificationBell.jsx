import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle, XCircle, Info } from 'lucide-react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api'

const ICONS = {
  dataset_approved: <CheckCircle size={16} className="text-green" />,
  dataset_rejected: <XCircle size={16} style={{ color: 'var(--red)' }} />,
  system: <Info size={16} />,
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [loaded, setLoaded] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  const fetchNotifs = useCallback(() => {
    getNotifications()
      .then(({ data }) => setNotifs(data.results || data))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000) // poll toutes les 30s
    return () => clearInterval(interval)
  }, [fetchNotifs])

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const unreadCount = notifs.filter(n => !n.is_read).length

  const handleOpen = () => setOpen(o => !o)

  const handleItemClick = async (n) => {
    if (!n.is_read) {
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
      markNotificationRead(n.id).catch(() => {})
    }
    if (n.dataset_id) navigate(`/datasets/${n.dataset_id}`)
    setOpen(false)
  }

  const handleMarkAll = () => {
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    markAllNotificationsRead().catch(() => {})
  }

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-bell-btn" onClick={handleOpen}>
        <Bell size={18} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAll}>Tout marquer comme lu</button>
            )}
          </div>
          <div className="notif-list">
            {!loaded ? (
              <div className="notif-empty">Chargement…</div>
            ) : notifs.length === 0 ? (
              <div className="notif-empty">Aucune notification pour le moment.</div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                onClick={() => handleItemClick(n)}
              >
                <span className="notif-icon">{ICONS[n.type] || <Info size={16} />}</span>
                <div className="notif-item-body">
                  <p>{n.message}</p>
                  <span className="notif-date">
                    {new Date(n.created_at).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                  </span>
                </div>
                {!n.is_read && <span className="notif-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}