/**
 * features/reading/ReadingView.tsx
 * 결과 화면 — 기본 해석은 광고 없이 바로 보여주고,
 * 심화 해석은 보상형 광고 시청 후에만 열람할 수 있다.
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
        showToast('광고를 끝까지 봐야 심화 해석을 볼 수 있어요.')
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
          용어가 어려워요? ⓘ
        </button>
      </header>

      <section className="reading-section">
        <h2>📌 전체 흐름</h2>
        <p className="base-interpretation">{reading.baseInterpretation}</p>
      </section>

      <section className="reading-section">
        <h2>초전 · 중전 · 말전</h2>
        <TransmissionCards
          transmissions={[reading.firstTransmission, reading.middleTransmission, reading.finalTransmission]}
        />
      </section>

      <section className="reading-section">
        <CourseDiagram reading={reading} />
      </section>

      <section className="reading-section detail-section">
        <h2>🔓 심화 해석</h2>
        {!detail && (
          <>
            <p className="detail-hint">광고를 하나 보면 상세 해석·행동 가이드를 볼 수 있어요.</p>
            <button type="button" className="cta-button secondary" onClick={handleUnlockDetail} disabled={loadingDetail}>
              {loadingDetail ? '준비하는 중…' : '광고 보고 심화 해석 보기'}
            </button>
          </>
        )}
        {detail && (
          <div className="detail-body">
            <p className="detail-text">{detail.detailText}</p>
            <h3>✅ 지금 할 수 있는 행동</h3>
            <ul>{detail.doNow.map((line, i) => <li key={i}>{line}</li>)}</ul>
            <h3>🚫 피해야 할 행동</h3>
            <ul>{detail.avoid.map((line, i) => <li key={i}>{line}</li>)}</ul>
            <h3>❓ 예상되는 변수</h3>
            <ul>{detail.expectedVariables.map((line, i) => <li key={i}>{line}</li>)}</ul>
            <h3>🏁 한 문장 결론</h3>
            <p className="one-line-conclusion">{detail.oneLineConclusion}</p>
          </div>
        )}
      </section>

      <button type="button" className="cta-button ghost" onClick={onRestart}>
        다른 질문 하기
      </button>

      <p className="disclaimer">
        이 결과는 참고용 콘텐츠이며, 중요한 결정은 전문가와 상의해 주세요.
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
