/**
 * features/reading/ReadingView.tsx
 * 결과 화면 — 기본 해설은 광고 없이 바로 보여 주고,
 * 더 자세한 해설은 보상형 광고 시청 후에만 열람할 수 있다.
 */
import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { LiurenReading } from '../../domain/liuren/calculateLiurenReading'
import { getDetailReading, type DetailReading } from './detailInterpretation'
import { watchRewardAd } from '../ads/rewardAd'
import CourseDiagram from './CourseDiagram'
import TransmissionCards from './TransmissionCards'
import GlossaryModal from './GlossaryModal'

interface ReadingViewProps {
  reading: LiurenReading
  onRestart: () => void
}

export default function ReadingView({ reading, onRestart }: ReadingViewProps) {
  const { showToast } = useApp()
  const [showGlossary, setShowGlossary] = useState(false)
  const [detail, setDetail] = useState<DetailReading | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  async function handleUnlockDetail() {
    if (loadingDetail || detail) return
    setLoadingDetail(true)
    try {
      const ad = await watchRewardAd('detail')
      if (ad.status !== 'completed') {
        showToast('광고를 끝까지 봐야 더 자세한 해설을 볼 수 있어요.')
        return
      }
      const result = await getDetailReading(reading)
      setDetail(result)
    } finally {
      setLoadingDetail(false)
    }
  }

  const mood = moodOf(reading.classification)

  return (
    <div className="reading-view">
      <header className="reading-header">
        <div className={`mood-banner mood-${mood.tone}`}>
          <span className="mood-emoji" aria-hidden="true">{mood.emoji}</span>
          <div className="mood-copy">
            <div className="mood-title">{mood.title}</div>
            <div className="mood-hint">{mood.hint}</div>
          </div>
        </div>
        <button type="button" className="glossary-trigger" onClick={() => setShowGlossary(true)}>
          말이 어려워요? ⓘ
        </button>
      </header>

      <section className="reading-section">
        <h2>📌 전체 흐름</h2>
        <p className="base-interpretation">{reading.baseInterpretation}</p>
        <div className="clarity-box">
          <span className="clarity-label">🎯 읽기의 또렷함</span>
          <span className="clarity-dots" aria-hidden="true">
            {'●'.repeat(reading.insight.clarityLevel) + '○'.repeat(3 - reading.insight.clarityLevel)}
          </span>
          <span className="clarity-text">{reading.insight.clarityLabel}</span>
        </div>
      </section>

      <section className="reading-section">
        <h2>🌱 시작 → 🔄 중간 → 🏁 마무리</h2>
        <TransmissionCards
          transmissions={[reading.firstTransmission, reading.middleTransmission, reading.finalTransmission]}
        />
      </section>

      <section className="reading-section">
        <CourseDiagram reading={reading} />
      </section>

      <section className="reading-section detail-section">
        <h2>🔓 더 자세한 해설</h2>
        {!detail && (
          <>
            <p className="detail-hint">광고를 하나 보면 지금 할 일과 피할 일까지 더 알려 드려요.</p>
            <button type="button" className="cta-button secondary" onClick={handleUnlockDetail} disabled={loadingDetail}>
              {loadingDetail ? '준비하는 중…' : '광고 보고 자세한 해설 보기'}
            </button>
          </>
        )}
        {detail && (
          <div className="detail-body">
            <p className="detail-text">{detail.detailText}</p>
            {detail.stageStory.length > 0 && (
              <>
                <h3>📖 단계별 이야기</h3>
                <ul>{detail.stageStory.map((line, i) => <li key={i}>{line}</li>)}</ul>
              </>
            )}
            {detail.sides.length > 0 && (
              <>
                <h3>🙋 나와 상대의 자리</h3>
                <ul>{detail.sides.map((line, i) => <li key={i}>{line}</li>)}</ul>
              </>
            )}
            <h3>✅ 지금 할 수 있는 일</h3>
            <ul>{detail.doNow.map((line, i) => <li key={i}>{line}</li>)}</ul>
            <h3>🚫 피하면 좋은 일</h3>
            <ul>{detail.avoid.map((line, i) => <li key={i}>{line}</li>)}</ul>
            <h3>❓ 달라질 수 있는 점</h3>
            <ul>{detail.expectedVariables.map((line, i) => <li key={i}>{line}</li>)}</ul>
            <h3>🏁 한 줄 결론</h3>
            <p className="one-line-conclusion">{detail.oneLineConclusion}</p>
          </div>
        )}
      </section>

      <button type="button" className="cta-button ghost" onClick={onRestart}>
        다른 질문 하기
      </button>

      <p className="disclaimer">
        이 결과는 재미로 보는 참고용이에요. 중요한 결정은 어른이나 전문가와 상의해 주세요.
      </p>

      {showGlossary && <GlossaryModal onClose={() => setShowGlossary(false)} />}
    </div>
  )
}

const MOOD_COPY: Record<LiurenReading['classification'], {
  emoji: string
  title: string
  hint: string
  tone: string
}> = {
  '긍정 우세': {
    emoji: '☀️',
    title: '흐름이 좋아요',
    hint: '지금 방향이 잘 맞아요.',
    tone: 'positive',
  },
  '신중한 긍정': {
    emoji: '🙂',
    title: '괜찮지만 천천히',
    hint: '서두르지 말고 한 걸음씩 가요.',
    tone: 'soft-positive',
  },
  '중립': {
    emoji: '⚖️',
    title: '보통이에요',
    hint: '크게 치우치지 않은 때예요.',
    tone: 'neutral',
  },
  '변수 많음': {
    emoji: '🔀',
    title: '바뀔 수 있어요',
    hint: '중간에 상황이 흔들릴 수 있어요.',
    tone: 'volatile',
  },
  '주의 필요': {
    emoji: '⚠️',
    title: '조심하세요',
    hint: '지금은 한 번 더 살펴보는 게 좋아요.',
    tone: 'caution',
  },
}

function moodOf(classification: LiurenReading['classification']) {
  return MOOD_COPY[classification]
}
