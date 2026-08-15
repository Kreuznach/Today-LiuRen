/**
 * components/TopBar.tsx
 * 화면 상단 바 — 뒤로 가기/종료 버튼과 제목을 보여 준다.
 */
interface TopBarProps {
  title: string
  onBack?: () => void
}

export default function TopBar({ title, onBack }: TopBarProps) {
  return (
    <div className="top-bar">
      {onBack && (
        <button type="button" className="top-bar-back" onClick={onBack} aria-label="뒤로 가기">
          ←
        </button>
      )}
      <h1 className="top-bar-title">{title}</h1>
    </div>
  )
}
