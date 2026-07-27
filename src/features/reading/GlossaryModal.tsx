/**
 * features/reading/GlossaryModal.tsx
 * "용어가 어려워요?" 버튼을 누르면 뜨는 간단한 용어 도움말 모달.
 */
import { GLOSSARY, GLOSSARY_ORDER } from '../../domain/liuren/data/glossary'

interface GlossaryModalProps {
  onClose: () => void
}

export default function GlossaryModal({ onClose }: GlossaryModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>용어 도움말</h2>
          <button type="button" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className="modal-body">
          {GLOSSARY_ORDER.map(term => (
            <div key={term} className="glossary-item">
              <strong>{term}</strong>
              <p>{GLOSSARY[term]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
