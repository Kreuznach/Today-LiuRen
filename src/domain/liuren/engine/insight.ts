/**
 * insight.ts — 육임 해석 정밀도를 높이는 로컬 분석 모듈
 *
 * score.ts 가 "전체 분위기"를 계산한다면, 이 모듈은 그 위에 다음을 더한다.
 *   1) 질문 주제별 판단(용신): 같은 모양이라도 사업·연애·건강·분실물·여행에서 읽는 칸이 다르다.
 *   2) 삼전 사이의 관계: 삼합(한 편)·충(정면 충돌)·육합(손잡기)·형(걸림)
 *   3) 힘의 흐름: 처음보다 끝이 강해지는지, 약해지는지
 *   4) 나(1과)와 상대(3과)의 자리 비교
 *   5) 단서: 분실물은 방향·장소, 시기 질문은 때(시간대·달)
 *   6) 읽기의 또렷함: 신호가 한 방향인지 엇갈리는지 (정직한 확신 표시)
 *
 * 난수·AI를 쓰지 않는다. 같은 입력이면 항상 같은 결과가 나온다.
 * 화면에 나가는 모든 문장은 쉬운 말로만 쓴다(tests/content.test.ts가 검사).
 */
import generalsData from '../data/generals.json'
import type {
  Branch, CoursePlatResult, Element, HeavenlyGeneral, QueryType, Relation, Strength, Transmission
} from '../types'
import {
  BRANCH_ELEMENT, PUNISH_BRANCH, SIX_HARMONY, STEM_ELEMENT,
  clashBranch, elementGenerates, elementOvercomes, postHorse, relationToDayStem
} from './elements'
import { computeStructureScore } from './score'
import type { QuestionIntent } from './intent'

interface GeneralNature { nature: string }

export interface ReadingInsight {
  /** 읽기의 또렷함 (1=흐릿, 2=보통, 3=뚜렷) */
  clarityLevel: 1 | 2 | 3
  clarityLabel: string
  clarityHint: string
  /** 판단 근거 (쉬운 말, 최대 5개) */
  evidence: string[]
  /** 나 쪽 · 상대 쪽 자리 설명 */
  mySide: string
  otherSide: string
  /** 처음 → 마무리로 갈 때 힘의 방향 */
  trend: 'rising' | 'steady' | 'falling'
  /** 분실물 단서: 방향·장소 */
  placeClue: string
  /** 시기 질문의 빠르기 판단 (마무리 칸의 힘 기준) */
  timingSpeed: string
  /** 시기 단서: 시간대·달 */
  timingClue: string
  /** 화면에 단서 상자를 보여 줄지 */
  showPlace: boolean
  showTiming: boolean
  /** 주제 보정까지 반영한 세 점수 (합 100) */
  adjusted: { positive: number; neutral: number; negative: number }
}

const POSITION_WEIGHT: Record<Transmission['position'], number> = {
  초전: 1.0, 중전: 0.85, 말전: 1.3,
}

type Hit = [positive: number, negative: number, note: string]

/** 주제별로 "어떤 역할의 칸"이 나오면 좋고 나쁜지 (용신 판단) */
const TOPIC_RELATION: Partial<Record<QueryType, Partial<Record<Relation, Hit>>>> = {
  사업: {
    재성: [4, 0, '일의 성과로 이어지는 힘이 보여요.'],
    식상: [2, 0, '직접 움직여 보여 줄 힘이 있어요.'],
    인수: [2.5, 0, '도움과 서류가 뒷받침해 줘요.'],
    비겁: [0, 2.5, '경쟁하는 사람이 끼어들 수 있어요.'],
  },
  연애: {
    재성: [2, 0, '상대와 이어지는 끈이 보여요.'],
    관귀: [2, 0, '상대의 존재감이 크게 느껴져요.'],
    인수: [1.5, 0, '서로를 챙기는 마음이 보여요.'],
    비겁: [0, 3, '사이에 끼어드는 사람이나 비교가 있을 수 있어요.'],
  },
  건강: {
    관귀: [0, 4.5, '몸을 누르는 부담이 보여요. 쉬어 주세요.'],
    식상: [3, 0, '몸을 풀고 회복하는 힘이 있어요.'],
    인수: [3, 0, '돌봐 주는 힘이 곁에 있어요.'],
  },
  분실물: {
    재성: [4.5, 0, '찾는 물건을 뜻하는 칸이 또렷해요.'],
    관귀: [0, 3, '물건이 멀어지거나 가려지기 쉬워요.'],
    비겁: [0, 2, '다른 사람 손을 탔을 수 있어요.'],
  },
  여행: {
    인수: [2, 0, '길을 안전하게 받쳐 주는 힘이 있어요.'],
    식상: [2, 0, '움직이기 좋은 힘이 있어요.'],
    관귀: [0, 3, '가는 길에 걸림돌이 있을 수 있어요.'],
  },
}

/** 주제별로 특히 눈여겨보는 기운 카드 */
const TOPIC_GENERAL: Partial<Record<QueryType, Partial<Record<HeavenlyGeneral, Hit>>>> = {
  사업: {
    청룡: [3, 0, '기회와 재물을 부르는 카드가 있어요.'],
    태상: [3, 0, '문서와 인정을 도와주는 카드가 있어요.'],
    귀인: [3, 0, '이끌어 주는 사람이 나타나기 쉬워요.'],
  },
  연애: {
    육합: [5, 0, '사이를 이어 주는 카드가 있어요.'],
    태음: [3, 0, '포근하게 감싸 주는 카드가 있어요.'],
    천후: [3, 0, '부드러운 마음을 뜻하는 카드가 있어요.'],
    현무: [0, 5, '숨기는 일이나 비밀이 끼기 쉬워요.'],
  },
  건강: {
    백호: [0, 5, '급히 아프거나 다치기 쉬워서 조심해야 해요.'],
    태음: [2, 0, '조용히 쉬면 회복이 잘 되는 카드가 있어요.'],
    귀인: [3, 0, '병원이나 어른의 도움을 받기 쉬워요.'],
  },
  분실물: {
    현무: [0, 5, '물건이 숨겨지거나 남의 손에 있을 수 있어요.'],
    천공: [0, 3, '물건이 빈 곳으로 사라진 느낌이 있어요.'],
    귀인: [2, 0, '누군가 찾아 주거나 알려 줄 수 있어요.'],
    태음: [2, 0, '조용한 곳에 안전하게 있을 수 있어요.'],
  },
  여행: {
    백호: [0, 4, '서두르다 다치거나 사고가 나기 쉬워요.'],
    청룡: [3, 0, '길이 열리고 기분 좋은 이동이 돼요.'],
    천공: [0, 2, '계획에 빈틈이 생기기 쉬워요.'],
    귀인: [2, 0, '가는 길에 도움을 받기 쉬워요.'],
  },
}

/** 세 칸이 같은 편(삼합)이 되는 묶음 */
const TRIADS: Branch[][] = [
  ['shen', 'zi', 'chen'], ['hai', 'mao', 'wei'], ['yin', 'wu', 'xu'], ['si', 'you', 'chou'],
]

const STRENGTH_RANK: Record<Strength, number> = { 왕: 5, 상: 4, 휴: 3, 수: 2, 사: 1 }

interface Adjustment {
  positive: number
  neutral: number
  negative: number
  notes: Array<{ weight: number; text: string }>
}

function isTriad(branches: Branch[]): boolean {
  const set = new Set(branches)
  return set.size === 3 && TRIADS.some(group => group.every(b => set.has(b)))
}

/** 주제·구조·흐름을 살펴 보정 점수와 근거 문장을 모은다. */
function computeAdjustment(result: CoursePlatResult): Adjustment {
  const adj: Adjustment = { positive: 0, neutral: 0, negative: 0, notes: [] }
  const { threeTransmissions: three, queryType } = result
  const branches = three.map(t => t.branch)

  // 1) 주제별 용신 판단 — 역할과 기운 카드를 각각 한 번씩 본다
  const relationTable = TOPIC_RELATION[queryType] ?? {}
  const generalTable = TOPIC_GENERAL[queryType] ?? {}
  for (const t of three) {
    const w = POSITION_WEIGHT[t.position]
    for (const hit of [relationTable[t.relation], generalTable[t.general]]) {
      if (!hit) continue
      adj.positive += hit[0] * w
      adj.negative += hit[1] * w
      adj.notes.push({ weight: Math.max(hit[0], hit[1]) * w, text: hit[2] })
    }
  }

  // 여행: 움직임을 뜻하는 칸(역마)이 있으면 이동이 일어나기 쉽다
  if (queryType === '여행' && branches.includes(postHorse(result.dayBranch))) {
    adj.positive += 3
    adj.notes.push({ weight: 3, text: '움직임을 뜻하는 칸이 있어 이동이나 변화가 생기기 쉬워요.' })
  }

  // 2) 세 단계 사이의 관계
  if (isTriad(branches)) {
    adj.positive += 8
    adj.notes.push({ weight: 8, text: '세 단계가 한 편이 되어 힘이 모여요.' })
  }
  const pairs: Array<[Branch, Branch]> = [
    [branches[0], branches[1]], [branches[1], branches[2]], [branches[0], branches[2]],
  ]
  if (pairs.some(([a, b]) => clashBranch(a) === b)) {
    adj.negative += 6
    adj.notes.push({ weight: 6, text: '단계끼리 정면으로 부딪히는 곳이 있어 계획이 흔들릴 수 있어요.' })
  }
  if (pairs.some(([a, b]) => SIX_HARMONY[a] === b)) {
    adj.positive += 4
    adj.notes.push({ weight: 4, text: '두 단계가 서로 손을 잡는 모양이라 협력이 잘 돼요.' })
  }
  if (pairs.some(([a, b]) => a !== b && PUNISH_BRANCH[a] === b)) {
    adj.negative += 3
    adj.notes.push({ weight: 3, text: '단계 사이에 걸리는 곳이 있어 작은 다툼이나 지연이 있을 수 있어요.' })
  }

  // 3) 힘의 흐름 — 끝으로 갈수록 힘이 붙는가, 빠지는가
  const trend = trendOf(three)
  if (trend === 'rising') {
    adj.positive += 4
    adj.notes.push({ weight: 4, text: '처음보다 마무리로 갈수록 힘이 붙어요.' })
  } else if (trend === 'falling') {
    adj.negative += 4
    adj.notes.push({ weight: 4, text: '처음보다 마무리로 갈수록 힘이 빠져요.' })
  }

  return adj
}

function trendOf(three: Transmission[]): ReadingInsight['trend'] {
  const diff = STRENGTH_RANK[three[2].strength] - STRENGTH_RANK[three[0].strength]
  if (diff >= 2) return 'rising'
  if (diff <= -2) return 'falling'
  return 'steady'
}

// ── 나와 상대의 자리 (1과 · 3과) ─────────────────────────────

const NATURE_ME: Record<string, string> = {
  길: '나는 지금 든든한 기운을 업고 있어요.',
  흉: '나는 지금 마음이 흔들리기 쉬운 자리에 있어요.',
}

const RELATION_ME: Record<Relation, string> = {
  인수: '도와주는 힘도 곁에 있어요.',
  재성: '손에 잡을 수 있는 것이 가까이 있어요.',
  식상: '표현하고 움직일 힘이 있어요.',
  비겁: '같은 편도 있지만 경쟁도 있어요.',
  관귀: '다만 눌리는 느낌이 있어요.',
}

const NATURE_OTHER: Record<string, string> = {
  길: '상대(또는 일이 벌어지는 자리)는 안정적이고 협조적이에요.',
  흉: '상대(또는 일이 벌어지는 자리)는 변수가 많고 흔들려요.',
}

function describeSides(result: CoursePlatResult): { mySide: string; otherSide: string } {
  const generals = generalsData as Record<HeavenlyGeneral, GeneralNature>
  const myUp = result.fourCourses[0].heaven
  const otherUp = result.fourCourses[2].heaven
  const myNature = generals[result.generalMap[myUp]]?.nature ?? '길'
  const otherNature = generals[result.generalMap[otherUp]]?.nature ?? '길'

  const me = STEM_ELEMENT[result.dayStem]
  const other = BRANCH_ELEMENT[otherUp]
  let power: string
  if (elementOvercomes(other, me)) power = '상대 쪽 힘이 나를 누르는 편이라 맞서기보다 맞춰 가세요.'
  else if (elementOvercomes(me, other)) power = '내가 이끌기 쉬운 쪽이에요. 다만 밀어붙이지는 마세요.'
  else if (elementGenerates(other, me)) power = '상대 쪽이 나를 도와주는 흐름이에요.'
  else if (elementGenerates(me, other)) power = '내가 상대에게 마음을 쏟는 흐름이라 지치지 않게 조절하세요.'
  else power = '서로 힘이 비슷해서 맞춰 가는 일이 중요해요.'

  return {
    mySide: `${NATURE_ME[myNature]} ${RELATION_ME[relationToDayStem(myUp, result.dayStem)]}`,
    otherSide: `${NATURE_OTHER[otherNature]} ${power}`,
  }
}

// ── 단서: 방향 · 장소 · 때 ────────────────────────────────────

const DIRECTION: Record<Branch, string> = {
  zi: '북쪽', chou: '북동쪽', yin: '북동쪽', mao: '동쪽', chen: '남동쪽', si: '남동쪽',
  wu: '남쪽', wei: '남서쪽', shen: '남서쪽', you: '서쪽', xu: '북서쪽', hai: '북서쪽',
}

const PLACE_BY_ELEMENT: Record<Element, string> = {
  수: '물이 가까운 곳(싱크대, 욕실, 냉장고 근처)',
  화: '불이나 전기가 가까운 곳(주방, 전자제품 근처)',
  목: '나무나 종이가 많은 곳(책장, 옷장, 책상 근처)',
  금: '금속이나 딱딱한 물건 곁(서랍, 가방 속 칸)',
  토: '바닥이나 낮은 곳(창고, 소파 밑, 흙 가까이)',
}

const HOUR_TEXT: Record<Branch, string> = {
  zi: '밤 11시~새벽 1시', chou: '새벽 1~3시', yin: '새벽 3~5시', mao: '아침 5~7시',
  chen: '아침 7~9시', si: '오전 9~11시', wu: '낮 11시~오후 1시', wei: '오후 1~3시',
  shen: '오후 3~5시', you: '저녁 5~7시', xu: '저녁 7~9시', hai: '밤 9~11시',
}

const MONTH_NUMBER: Record<Branch, number> = {
  yin: 2, mao: 3, chen: 4, si: 5, wu: 6, wei: 7, shen: 8, you: 9, xu: 10, hai: 11, zi: 12, chou: 1,
}

/** 찾는 물건을 뜻하는 칸(재성)이 있으면 그 칸을, 없으면 마무리 칸을 단서로 쓴다. */
function buildPlaceClue(three: Transmission[]): string {
  const target = three.find(t => t.relation === '재성') ?? three[2]
  const text = `방향 ${DIRECTION[target.branch]} · 살펴볼 곳 ${PLACE_BY_ELEMENT[BRANCH_ELEMENT[target.branch]]}`
  return target.isVoid ? `${text}. 다만 그 칸이 비어 있어 단서가 흐릴 수 있어요.` : text
}

/** 마무리 칸의 힘으로 빠르기를 읽는다. */
function buildTimingSpeed(last: Transmission): string {
  if (last.isVoid) return '아직 때가 정해지지 않았어요. 더 미뤄질 수 있어요.'
  if (last.strength === '왕' || last.strength === '상') return '가까운 때에 움직임이 보여요.'
  if (last.strength === '휴') return '조금 기다리면 알맞은 때가 보여요.'
  return '시간이 꽤 걸리거나 늦어질 수 있어요.'
}

/** 칸의 이름으로 시간대와 달을 짐작한다. */
function buildTimingClue(last: Transmission): string {
  return `소식이나 변화는 ${HOUR_TEXT[last.branch]}쯤, 달로는 ${MONTH_NUMBER[last.branch]}월쯤에 보이기 쉬워요.`
}

// ── 읽기의 또렷함 ────────────────────────────────────────────

const CLARITY: Record<1 | 2 | 3, [string, string]> = {
  3: ['뚜렷해요', '여러 신호가 같은 방향을 가리켜요.'],
  2: ['어느 정도 뚜렷해요', '대체로 한 방향이지만 엇갈리는 신호도 있어요.'],
  1: ['흐릿해요', '신호가 엇갈려서 한 가지로 단정하기 어려워요.'],
}

function normalize(p: number, n: number, g: number): ReadingInsight['adjusted'] {
  const positive = Math.max(p, 1)
  const neutral = Math.max(n, 1)
  const negative = Math.max(g, 1)
  const total = positive + neutral + negative
  const rp = Math.round((positive / total) * 100)
  const rn = Math.round((neutral / total) * 100)
  return { positive: rp, neutral: rn, negative: 100 - rp - rn }
}

/** 한 번의 계산 결과에서 정밀 분석 전체를 만든다. */
export function computeInsight(result: CoursePlatResult, intent: QuestionIntent): ReadingInsight {
  const base = computeStructureScore(result)
  const adj = computeAdjustment(result)
  const adjusted = normalize(
    base.positive + adj.positive,
    base.neutral + adj.neutral,
    base.negative + adj.negative
  )

  const sorted = [adjusted.positive, adjusted.neutral, adjusted.negative].sort((a, b) => b - a)
  const margin = sorted[0] - sorted[1]
  let level: 1 | 2 | 3 = margin >= 20 ? 3 : margin >= 10 ? 2 : 1
  if ((result.threeTransmissions[2].isVoid || result.courseName === '반음과') && level > 1) {
    level = (level - 1) as 1 | 2
  }

  const topicNotes = adj.notes
    .sort((a, b) => b.weight - a.weight)
    .map(n => n.text)
  const evidence = [...new Set([...topicNotes, ...base.reasons])].slice(0, 5)
  const sides = describeSides(result)

  return {
    clarityLevel: level,
    clarityLabel: CLARITY[level][0],
    clarityHint: CLARITY[level][1],
    evidence,
    ...sides,
    trend: trendOf(result.threeTransmissions),
    placeClue: buildPlaceClue(result.threeTransmissions),
    timingSpeed: buildTimingSpeed(result.threeTransmissions[2]),
    timingClue: buildTimingClue(result.threeTransmissions[2]),
    showPlace: result.queryType === '분실물' || intent === '장소' || intent === '찾기',
    showTiming: intent === '시기',
    adjusted,
  }
}
