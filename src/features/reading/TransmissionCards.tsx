/**
 * features/reading/TransmissionCards.tsx
 * 시작(초전)·중간(중전)·마무리(말전)를 각각 카드로 보여준다.
 */
import type { Transmission } from '../../domain/liuren/types'
import { branchLabel, strengthLabel } from '../../domain/liuren/labels'

const POSITION_ICON: Record<Transmission['position'], string> = {
  초전: '🌱', 중전: '🔄', 말전: '🏁',
}

/** 화면에는 한자 용어 대신 쉬운 말을 쓴다 */
const POSITION_PLAIN: Record<Transmission['position'], string> = {
  초전: '시작', 중전: '중간', 말전: '마무리',
}

interface TransmissionCardsProps {
  transmissions: [Transmission, Transmission, Transmission]
}

export default function TransmissionCards({ transmissions }: TransmissionCardsProps) {
  return (
    <div className="transmission-cards">
      {transmissions.map(t => (
        <div key={t.position} className={`transmission-card${t.isVoid ? ' is-void' : ''}`}>
          <div className="transmission-title">
            {POSITION_ICON[t.position]} {POSITION_PLAIN[t.position]}
          </div>
          <div className="transmission-branch">{branchLabel(t.branch)}</div>
          <div className="transmission-general">기운 카드: {t.general}</div>
          <div className="transmission-strength">힘: {strengthLabel(t.strength)}</div>
          {t.isVoid && <div className="transmission-void-badge">아직 빈 자리</div>}
        </div>
      ))}
    </div>
  )
}
