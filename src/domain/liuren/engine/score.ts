/**
 * score.ts — 로컬 기운 점수 계산 모듈
 *
 * AI가 없어도 결과의 분위기(긍정/중립/부정)를 과전 구조만으로 판단하기 위한 모듈이다.
 * "느낌"이 아니라 육임에서 실제로 쓰는 판단 근거를 점수로 바꾼다.
 *
 * 점수에 반영하는 것
 *   1) 과체(課體)가 가진 기본 성향
 *   2) 삼전에 앉은 천장(天將)의 길흉
 *   3) 각 전의 왕상휴수사 — 힘이 센지 약한지
 *   4) 공망(空亡) — 비어 있어 결과가 잘 맺히지 않는 자리
 *   5) 일간(나) 기준 역할 — 도움(인수)·성과(재성)·압박(관귀)
 *   6) 삼전의 오행 흐름 — 서로 살려 주는지(相生) 치는지(相剋)
 *   7) 말전(결말) 가중치 — 끝이 어디로 가는지가 가장 중요하다
 */
import generalsData from '../data/generals.json'
import type {
  CoursePlatResult, HeavenlyGeneral, Relation, Strength, Transmission
} from '../types'
import { BRANCH_ELEMENT, elementGenerates, elementOvercomes } from './elements'

interface GeneralNature { nature: string }

/** 점수 3분할 결과 */
export interface StructureScore {
  positive: number
  neutral: number
  negative: number
  /** 사람이 읽을 수 있는 판단 근거 */
  reasons: string[]
}

/** 과체별 기본 성향 (positive / neutral / negative) */
const COURSE_PROFILE: Record<string, [number, number, number]> = {
  원수과: [64, 24, 12],
  중심과: [28, 54, 18],
  비용과: [34, 44, 22],
  섭해과: [24, 31, 45],
  요극과: [31, 43, 26],
  묘성과: [22, 44, 34],
  별책과: [34, 47, 19],
  팔전과: [24, 46, 30],
  복음과: [16, 58, 26],
  반음과: [18, 37, 45],
  연여과: [56, 33, 11],
  진연주격: [68, 23, 9],
  퇴연주격: [27, 48, 25],
}

const DEFAULT_PROFILE: [number, number, number] = [36, 38, 26]

/** 자리별 비중 — 끝(말전)이 가장 중요하다 */
const POSITION_WEIGHT: Record<Transmission['position'], number> = {
  초전: 1.0, 중전: 0.85, 말전: 1.3
}

/** 힘의 세기에 따른 증폭 */
const STRENGTH_FACTOR: Record<Strength, number> = {
  왕: 1.35, 상: 1.15, 휴: 0.85, 수: 0.7, 사: 0.6
}

/** 일간 기준 역할이 주는 가감점 */
const RELATION_SCORE: Record<Relation, [number, number, number]> = {
  인수: [5.0, 1.0, 0],     // 도와주는 힘
  재성: [4.5, 0.5, 0],     // 손에 잡히는 성과
  비겁: [1.5, 2.5, 1.0],   // 같은 편이자 경쟁자
  식상: [3.0, 2.0, 0.5],   // 표현하고 움직이는 힘
  관귀: [0, 1.5, 5.0],     // 누르는 힘 · 압박
}

const STRENGTH_TEXT: Record<Strength, string> = {
  왕: '아주 힘이 좋은', 상: '힘이 붙는', 휴: '한숨 돌리는',
  수: '갇혀 있는', 사: '기운이 빠진'
}

/** 삼전 위치를 어려운 한자어 대신 일상어로 (초전→처음, 말전→마지막 …) */
const POSITION_PLAIN: Record<Transmission['position'], string> = {
  초전: '처음 단계', 중전: '중간 단계', 말전: '마지막 단계'
}

/**
 * 과전 구조에서 기운 점수를 계산한다.
 */
export function computeStructureScore(result: CoursePlatResult): StructureScore {
  const generals = generalsData as Record<HeavenlyGeneral, GeneralNature>
  const [p0, n0, g0] = COURSE_PROFILE[result.courseName] ?? DEFAULT_PROFILE

  let positive = p0
  let neutral = n0
  let negative = g0
  const reasons: string[] = []

  // ── 삼전 각각을 살펴본다 ──────────────────────────────
  for (const t of result.threeTransmissions) {
    const weight = POSITION_WEIGHT[t.position]
    const factor = STRENGTH_FACTOR[t.strength]
    const nature = generals[t.general]?.nature

    if (nature === '길') {
      positive += 8 * weight * factor
      negative -= 1.2 * weight
    } else if (nature === '흉') {
      negative += 8 * weight * factor
      positive -= 1.0 * weight
    } else {
      neutral += 3.5 * weight * factor
    }

    const [rp, rn, rg] = RELATION_SCORE[t.relation]
    positive += rp * weight
    neutral += rn * weight
    negative += rg * weight

    // 공망 — 힘이 비어 결과가 잘 맺히지 않는다
    if (t.isVoid) {
      neutral += 6 * weight
      positive -= 3 * weight
      negative -= 1 * weight
      reasons.push(`${POSITION_PLAIN[t.position]}는 아직 자리가 비어 있어, 그 부분은 결론이 늦게 정해집니다.`)
    } else if (t.strength === '왕' || t.strength === '사') {
      reasons.push(`${POSITION_PLAIN[t.position]}는 ${STRENGTH_TEXT[t.strength]} 자리입니다.`)
    }
  }

  // ── 삼전의 오행 흐름 ─────────────────────────────────
  const [a, b, c] = result.threeTransmissions.map(t => BRANCH_ELEMENT[t.branch])
  const flowGenerates =
    (elementGenerates(a, b) ? 1 : 0) + (elementGenerates(b, c) ? 1 : 0)
  const flowOvercomes =
    (elementOvercomes(a, b) ? 1 : 0) + (elementOvercomes(b, c) ? 1 : 0)

  if (flowGenerates > 0) {
    positive += 6 * flowGenerates
    reasons.push('앞 단계가 다음 단계를 밀어 주는 흐름이라 일이 이어지기 쉽습니다.')
  }
  if (flowOvercomes > 0) {
    negative += 6 * flowOvercomes
    reasons.push('단계마다 부딪히는 지점이 있어 속도가 한 번씩 꺾입니다.')
  }

  // ── 특수 구조 보정 ───────────────────────────────────
  if (result.patternNames.includes('연여과')) {
    positive += 6
    reasons.push('흐름이 한 칸씩 앞으로 나아가는 모양이라 일이 순조롭게 이어집니다.')
  }
  if (result.patternNames.includes('퇴연주격')) {
    neutral += 6
    reasons.push('흐름이 한 칸씩 뒤로 물러나는 모양이라 서두르면 손해입니다.')
  }
  if (result.courseName === '복음과') {
    reasons.push('지금은 상황이 멈춰 있어 새로 벌이기보다 지키는 편이 낫습니다.')
  }
  if (result.courseName === '반음과') {
    reasons.push('갔다가 되돌아오는 모양이라 결정이 한 번 뒤집힐 수 있습니다.')
  }

  return normalize({ positive, neutral, negative, reasons })
}

/** 세 값을 합 100의 정수 비율로 정리한다 */
function normalize(raw: StructureScore): StructureScore {
  const positive = Math.max(raw.positive, 5)
  const neutral = Math.max(raw.neutral, 5)
  const negative = Math.max(raw.negative, 5)
  const total = positive + neutral + negative

  const rp = (positive / total) * 100
  const rn = (neutral / total) * 100
  const rg = (negative / total) * 100

  let p = Math.round(rp)
  let n = Math.round(rn)
  let g = Math.round(rg)

  const remainder = 100 - (p + n + g)
  if (remainder !== 0) {
    const top = Math.max(rp, rn, rg)
    if (top === rp) p += remainder
    else if (top === rn) n += remainder
    else g += remainder
  }

  return { positive: p, neutral: n, negative: g, reasons: raw.reasons }
}
