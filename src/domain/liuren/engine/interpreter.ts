/**
 * interpreter.ts — 사전(JSON) 기반 로컬 해석 모듈
 *
 * AI 없이도 결과의 품질이 떨어지지 않도록, 과전 계산 결과를 그대로 문장으로 바꾼다.
 * 화면에는 점술 전문 용어를 쓰지 않고, 초등 고학년도 읽을 수 있는 말로만 출력한다.
 *
 * 문장을 만드는 재료
 *   · 과체(課體)   → courses.json  (전체 분위기 · 질문 유형별 조언)
 *   · 천장(天將)   → generals.json (초전/중전/말전 각각의 의미)
 *   · 계산 결과    → 힘의 세기, 공망, 일간 기준 역할, 오행 흐름
 */
import coursesData from '../data/courses.json'
import generalsData from '../data/generals.json'
import type {
  CoursePlatResult, HeavenlyGeneral, Relation, Strength, TransmissionPosition
} from '../types'
import { computeStructureScore } from './score'

interface CourseEntry {
  number: number
  summary?: string
  general: string
  focus?: string
  advice?: string
  byQuery: Record<string, string>
}

interface GeneralEntry {
  name: string
  element: string
  nature: string
  summary?: string
  general: string
  inInitial: string
  inMiddle: string
  inFinal: string
  advice?: string
}

/** 삼전 위치 → 화면에 보여 줄 단계 라벨 */
const PHASE_LABEL: Record<TransmissionPosition, string> = {
  초전: '🌱 시작',
  중전: '🔄 중간',
  말전: '🏁 마무리'
}

const PHASE_KEY: Record<TransmissionPosition, keyof GeneralEntry> = {
  초전: 'inInitial',
  중전: 'inMiddle',
  말전: 'inFinal'
}

/** 힘의 세기를 일상어로 */
const STRENGTH_NOTE: Record<Strength, string> = {
  왕: '힘이 셀 때라 밀어도 잘 버텨요.',
  상: '힘이 붙는 때라 조금씩 나아져요.',
  휴: '한숨 돌릴 때라 무리하면 지쳐요.',
  수: '길이 막혀 있어 답답할 수 있어요.',
  사: '힘이 빠져 혼자서는 버거워요.'
}

/** 일간(나) 기준 역할을 일상어로 */
const RELATION_NOTE: Record<Relation, string> = {
  비겁: '내 편과 경쟁자가 같이 있는 자리예요.',
  식상: '내가 말하고 움직여야 풀리는 자리예요.',
  재성: '눈에 보이는 성과나 돈이 걸린 자리예요.',
  관귀: '지켜야 할 규칙이나 압박이 있는 자리예요.',
  인수: '도와줄 사람이나 정보가 붙는 자리예요.'
}

/** 흉(凶) 성격의 천장이 있으면 조심할 점으로 안내 */
function buildCaution(result: CoursePlatResult, generals: Record<HeavenlyGeneral, GeneralEntry>): string {
  const risky = result.threeTransmissions.filter(t => generals[t.general]?.nature === '흉')
  const weak = result.threeTransmissions.filter(t => t.strength === '수' || t.strength === '사')
  const empty = result.threeTransmissions.filter(t => t.isVoid)

  const lines: string[] = []
  if (risky.length > 0) {
    lines.push('말과 글에서 오해가 나기 쉬워요. 한 번 더 확인하세요.')
  }
  if (weak.length > 0) {
    lines.push('혼자 밀기보다 도움을 받는 편이 안전해요.')
  }
  if (empty.length > 0) {
    lines.push('아직 정해지지 않은 부분이 있어요. 지금은 결정을 미루세요.')
  }
  return lines.join(' ')
}

/**
 * 과전 데이터를 기반으로 로컬 해석 텍스트를 만든다.
 */
export function buildFallbackInterpretation(result: CoursePlatResult): string {
  const courses = coursesData as Record<string, CourseEntry>
  const generals = generalsData as Record<HeavenlyGeneral, GeneralEntry>

  const courseEntry = courses[result.courseName]
  const summaryText = courseEntry?.summary
    ?? '지금 흐름을 차분히 살펴보라는 뜻이에요.'
  const baseText = courseEntry?.general
    ?? '지금의 흐름을 기준으로 상황을 풀어 설명해요.'
  const adviceText = courseEntry?.advice ?? courseEntry?.focus ?? ''
  const queryText = courseEntry?.byQuery?.[result.queryType] ?? ''

  // 단계별 문장 — 천장 의미 + 힘의 세기 + 역할을 한 줄로 합친다
  const phaseLines = result.threeTransmissions.map(t => {
    const g = generals[t.general]
    if (!g) return ''
    const meaning = g[PHASE_KEY[t.position]]
    const extra = t.isVoid
      ? '아직 자리가 비어 있어 결론을 미루는 편이 나아요.'
      : STRENGTH_NOTE[t.strength]
    return `${PHASE_LABEL[t.position]}: ${meaning} ${extra}`
  }).filter(Boolean)

  // 지금 무엇이 걸려 있는 문제인지 (말전 = 결말 기준)
  const finalTransmission = result.threeTransmissions[2]
  const stakeText = finalTransmission ? RELATION_NOTE[finalTransmission.relation] : ''

  const score = computeStructureScore(result)
  const readingText = score.reasons.slice(0, 3).join(' ')

  const cautionText = buildCaution(result, generals)

  const parts = [
    `📌 한눈에 보기\n${summaryText}`,
    `🧭 지금 흐름\n${baseText}${stakeText ? ` ${stakeText}` : ''}`,
    queryText ? `💬 이 질문이라면\n${queryText}` : '',
    phaseLines.length > 0 ? `⏳ 시작 → 중간 → 마무리\n${phaseLines.join('\n')}` : '',
    readingText ? `🔎 이렇게 봤어요\n${readingText}` : '',
    cautionText ? `⚠️ 조심할 점\n${cautionText}` : '',
    adviceText ? `✅ 이렇게 해 보세요\n${adviceText}` : ''
  ].filter(Boolean)

  return parts.join('\n\n')
}
