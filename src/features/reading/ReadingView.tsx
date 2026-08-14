/**
 * features/reading/ReadingView.tsx
 * 결과 화면 — 기본 해설은 광고 없이 바로 보여주고,
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

  return (
    <div className="reading-view">
      <header className="reading-header">
        <span className={`classification-badge classification-${classificationTone(reading.classification)}`}>
          {reading.classification}
        </span>
        <button type="button" className="glossary-trigger" onClick={() => setShowGlossary(true)}>
          말이 어려워요? ⓘ
        </button>
      </header>

      <section className="reading-section">
        <h2>📌 전체 흐름</h2>
        <p className="base-interpretation">{reading.baseInterpretation}</p>
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
            <p className="detail-hint">광고를 하나 보면 지금 할 일과 피할 일까지 더 알려드려요.</p>
            <button type="button" className="cta-button secondary" onClick={handleUnlockDetail} disabled={loadingDetail}>
              {loadingDetail ? '준비하는 중…' : '광고 보고 자세한 해설 보기'}
            </button>
          </>
        )}
        {detail && (
          <div className="detail-body">
            <p className="detail-text">{detail.detailText}</p>
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

function classificationTone(classification: LiurenReading['classification']): string {
  switch (classification) {
    case '긍정 우세': return 'positive'
    case '신중한 긍정': return 'soft-positive'
    case '중립': return 'neutral'
    case '변수 많음': return 'volatile'
    case '주의 필요': return 'caution'
    default: return 'neutral'
  }
}
