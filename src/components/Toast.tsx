/**
 * components/Toast.tsx
 * 화면 하단에 잠깐 나타났다 사라지는 안내 메시지.
 */
import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toast } = useApp()
  if (!toast.visible) return null
  return <div className="toast">{toast.msg}</div>
}
