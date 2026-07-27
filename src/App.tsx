/**
 * App.tsx
 * 최상위 컴포넌트 — 질문 화면과 결과 화면을 전환한다.
 */
import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Toast from './components/Toast'
import TopBar from './components/TopBar'
import QuestionView from './features/question/QuestionView'
import ReadingView from './features/reading/ReadingView'
import type { LiurenReading } from './domain/liuren/calculateLiurenReading'

function Shell() {
  const { view, goTo } = useApp()
  const [reading, setReading] = useState<LiurenReading | null>(null)

  function handleReady(next: LiurenReading) {
    setReading(next)
    goTo('reading')
  }

  function handleRestart() {
    setReading(null)
    goTo('question')
  }

  return (
    <div className="app-shell">
      <TopBar
        title={view === 'question' ? '오늘의 육임점' : '오늘의 점괘'}
        onBack={view === 'reading' ? handleRestart : undefined}
      />
      <main className="app-main">
        {view === 'question' && <QuestionView onReady={handleReady} />}
        {view === 'reading' && reading && <ReadingView reading={reading} onRestart={handleRestart} />}
      </main>
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
