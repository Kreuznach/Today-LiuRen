/**
 * features/question/categories.ts
 * 질문 화면에 노출되는 5개 카테고리 (기획서 8장 기준)
 */
import type { LiurenCategory } from '../../domain/liuren/calculateLiurenReading'

export interface CategoryOption {
  key: LiurenCategory
  label: string
  icon: string
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: '관계', label: '관계', icon: '💞' },
  { key: '일사업', label: '일·사업', icon: '💼' },
  { key: '선택결정', label: '선택·결정', icon: '🤔' },
  { key: '분실이동', label: '분실·이동', icon: '🧳' },
  { key: '기타', label: '기타', icon: '🔮' },
]
