/**
 * features/reading/TransmissionCards.tsx
 * 초전·중전·말전을 각각 카드로 보여준다.
 */
import type { Transmission } from '../../domain/liuren/types'
import { branchLabel } from '../../domain/liuren/labels'

const POSITION_ICON: Record<Transmission['position'], string> = {
  초전: '🌱', 중전: '🔄', 말전: '🏁',
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
            {POSITION_ICON[t.position]} {t.position}
          </div>
          <div className="transmission-branch">{branchLabel(t.branch)}</div>
          <div className="transmission-general">천장: {t.general}</div>
          <div className="transmission-strength">기세: {t.strength}</div>
          {t.isVoid && <div className="transmission-void-badge">공망</div>}
        </div>
      ))}
    </div>
  )
}
