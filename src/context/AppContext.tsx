/**
 * context/AppContext.tsx
 * 전역 앱 상태 — 화면 전환, 하루 이용 상태, 토스트 알림.
 * Today-RPS(D:\Projects\CodingLan\Today-RPS)의 컨텍스트 패턴을 따른다.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  type DailyUsageState, loadDailyUsage,
} from '../platform/storage/dailyUsage'
import { closeApp } from '../platform/apps-in-toss/environment'

export type ViewKey = 'question' | 'reading'

interface ToastState {
  msg: string
  visible: boolean
}

interface AppContextValue {
  view: ViewKey
  goTo: (view: ViewKey) => void
  dailyUsage: DailyUsageState
  refreshDailyUsage: () => void
  toast: ToastState
  showToast: (msg: string, duration?: number) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<ViewKey>('question')
  const [dailyUsage, setDailyUsage] = useState<DailyUsageState>(() => loadDailyUsage())
  const [toast, setToast] = useState<ToastState>({ msg: '', visible: false })
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = useCallback((msg: string, duration = 2500) => {
    clearTimeout(toastTimer.current)
    setToast({ msg, visible: true })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), duration)
  }, [])

  const refreshDailyUsage = useCallback(() => {
    setDailyUsage(loadDailyUsage())
  }, [])

  const goTo = useCallback((next: ViewKey) => {
    setView(next)
  }, [])

  // Android 하드웨어 백버튼: 질문 화면에서는 앱 종료, 결과 화면에서는 질문 화면으로 복귀
  useEffect(() => {
    window.history.pushState(null, '')
    function onPopState() {
      setView(current => {
        if (current === 'question') {
          closeApp()
          window.history.pushState(null, '')
          return current
        }
        window.history.pushState(null, '')
        return 'question'
      })
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const value: AppContextValue = {
    view, goTo, dailyUsage, refreshDailyUsage, toast, showToast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
