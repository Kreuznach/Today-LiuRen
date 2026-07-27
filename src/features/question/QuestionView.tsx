/**
 * features/question/QuestionView.tsx
 * 질문 화면 — 카테고리 선택, 질문 입력, 점시(현재/직접 지정) 선택, 결과 보기.
 */
import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { CATEGORY_OPTIONS } from './categories'
import type { LiurenCategory } from '../../domain/liuren/calculateLiurenReading'
import { calculateLiurenReading, type LiurenReading } from '../../domain/liuren/calculateLiurenReading'
import {
  canAskFirstQuestion, canAskExtraQuestion,
  markFirstQuestionAsked, markExtraQuestionAsked, unlockExtraQuestion,
} from '../../platform/storage/dailyUsage'
import { watchRewardAd } from '../ads/rewardAd'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeInputValue(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface QuestionViewProps {
  onReady: (reading: LiurenReading) => void
}

export default function QuestionView({ onReady }: QuestionViewProps) {
  const { dailyUsage, refreshDailyUsage, showToast } = useApp()

  const [category, setCategory] = useState<LiurenCategory>('기타')
  const [question, setQuestion] = useState('')
  const [useManualTime, setUseManualTime] = useState(false)
  const now = useMemo(() => new Date(), [])
  const [dateValue, setDateValue] = useState(toDateInputValue(now))
  const [timeValue, setTimeValue] = useState(toTimeInputValue(now))
  const [loading, setLoading] = useState(false)

  const isFirstFree = canAskFirstQuestion(dailyUsage)
  const isExtraTurn = !isFirstFree && canAskExtraQuestion(dailyUsage)
  const noMoreQuestions = !isFirstFree && !canAskExtraQuestion(dailyUsage)

  function resolveAskedAt(): Date {
    if (!useManualTime) return new Date()
    const [y, m, d] = dateValue.split('-').map(Number)
    const [hh, mm] = timeValue.split(':').map(Number)
    return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0)
  }

  async function handleSubmit() {
    if (loading) return
    if (noMoreQuestions) {
      showToast('오늘의 질문 횟수를 모두 사용했어요. 내일 다시 찾아 주세요!')
      return
    }

    setLoading(true)
    try {
      // 추가 질문(2번째)은 보상형 광고 시청 후에만 물어볼 수 있다.
      if (isExtraTurn && !dailyUsage.extraQuestionUnlocked) {
        const ad = await watchRewardAd('extraQuestion')
        if (ad.status !== 'completed') {
          showToast('광고를 끝까지 봐야 추가 질문을 할 수 있어요.')
          return
        }
        unlockExtraQuestion(dailyUsage)
        refreshDailyUsage()
      }

      const askedAt = resolveAskedAt()
      const reading = calculateLiurenReading({ askedAt, category, question })

      if (isFirstFree) markFirstQuestionAsked(dailyUsage)
      else markExtraQuestionAsked(dailyUsage)
      refreshDailyUsage()

      onReady(reading)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="question-view">
      <header className="question-header">
        <h1>오늘의 육임점</h1>
        <p className="question-subtitle">궁금한 것을 물어보면, 지금 이 순간의 흐름으로 풀어드려요.</p>
      </header>

      <section className="question-section">
        <h2>어떤 이야기가 궁금한가요?</h2>
        <div className="category-grid">
          {CATEGORY_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              className={`category-chip${category === opt.key ? ' selected' : ''}`}
              onClick={() => setCategory(opt.key)}
            >
              <span className="category-icon">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="question-section">
        <h2>질문을 적어 주세요</h2>
        <textarea
          className="question-textarea"
          placeholder="예: 지금 이 선택을 해도 괜찮을까요?"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={3}
          maxLength={200}
        />
      </section>

      <section className="question-section">
        <div className="advanced-toggle-row">
          <h2>점 보는 시각</h2>
          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setUseManualTime(v => !v)}
          >
            {useManualTime ? '지금 시각으로 보기' : '시각 직접 입력하기'}
          </button>
        </div>
        {useManualTime ? (
          <div className="time-inputs">
            <input
              type="date"
              value={dateValue}
              onChange={e => setDateValue(e.target.value)}
            />
            <input
              type="time"
              value={timeValue}
              onChange={e => setTimeValue(e.target.value)}
            />
          </div>
        ) : (
          <p className="now-label">지금 시각을 기준으로 점을 봅니다.</p>
        )}
      </section>

      <div className="daily-usage-hint">
        {isFirstFree && '오늘의 첫 질문은 무료로 기본 해석을 볼 수 있어요.'}
        {isExtraTurn && '오늘 이미 한 번 물어봤어요. 광고를 보면 한 번 더 물어볼 수 있어요.'}
        {noMoreQuestions && '오늘 질문 횟수를 모두 사용했어요. 내일 다시 와 주세요.'}
      </div>

      <button
        type="button"
        className="cta-button"
        onClick={handleSubmit}
        disabled={loading || noMoreQuestions}
      >
        {loading ? '점괘를 살펴보는 중…' : '결과 보기'}
      </button>

      <p className="disclaimer">
        이 서비스는 재미로 보는 참고용 콘텐츠이며, 의학·법률·재정 등 전문적인 판단을 대신하지 않습니다.
      </p>
    </div>
  )
}
