/**
 * tests/insight.test.ts — 정밀 분석(질문 뜻 · 주제 판단 · 단서 · 또렷함) 테스트
 *
 * 1) 질문의 뜻을 질문 "전체"에서 찾는지 (예전에는 앞 28자만 보았다)
 * 2) 같은 입력이면 항상 같은 결과인지 (난수 금지)
 * 3) 점수·단서·근거가 약속한 모양을 지키는지
 * 4) 특정 구조(삼합·충)와 단서(방향·시간)를 정확히 읽는지
 */
import { calculateCoursePlat } from '../src/domain/liuren/engine/coursePlate'
import { computeInsight } from '../src/domain/liuren/engine/insight'
import { detectIntent } from '../src/domain/liuren/engine/intent'
import { calculateLiurenReading, type LiurenCategory } from '../src/domain/liuren/calculateLiurenReading'
import type { Branch, CoursePlatResult, Relation, QueryType } from '../src/domain/liuren/types'

let passed = 0
let failed = 0
const failures: string[] = []

function test(name: string, fn: () => void): void {
  try {
    fn()
    passed++
  } catch (err) {
    failed++
    failures.push(`  ✗ ${name}\n      ${err instanceof Error ? err.message : String(err)}`)
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

/** 실제 계산 결과의 삼전 세 칸을 원하는 값으로 바꿔 특정 구조만 따로 시험한다. */
function withTransmissions(
  queryType: QueryType,
  branches: [Branch, Branch, Branch],
  relation: Relation = '비겁'
): CoursePlatResult {
  const base = calculateCoursePlat(new Date(2026, 6, 25, 9, 15), queryType)
  return {
    ...base,
    queryType,
    threeTransmissions: base.threeTransmissions.map((t, i) => ({
      ...t, branch: branches[i], relation, isVoid: false, strength: '상' as const,
    })),
  }
}

// ── 1) 질문의 뜻 ─────────────────────────────────────────────
test('질문의 뜻(시기·장소·찾기·회복·선택·마음·결과)을 알맞게 찾는다', () => {
  const cases: Array<[string, QueryType, string]> = [
    ['언제 다시 만나는 게 좋을까?', '연애', '시기'],
    ['휴대폰이 어디에 있을까?', '분실물', '장소'],
    ['잃어버린 열쇠를 찾을 수 있을까?', '분실물', '찾기'],
    ['허리 통증이 회복될까?', '건강', '회복'],
    ['내일 만남이 즐거울까?', '연애', '즐거움'],
    ['새 가방을 살까?', '기타', '선택'],
    ['다음 달 해외여행을 떠나도 될까?', '여행', '선택'],
    ['소개팅 상대가 나에게 호감이 있을까?', '연애', '마음'],
    ['이번 면접에 합격할 수 있을까?', '사업', '결과'],
    ['그냥 궁금해요', '기타', '일반'],
  ]
  for (const [question, queryType, expected] of cases) {
    const actual = detectIntent(question, queryType)
    assert(actual === expected, `"${question}" 뜻: 기대값 ${expected}, 실제값 ${actual}`)
  }
})

test('질문이 길어도 끝부분의 낱말까지 읽는다', () => {
  const question = '요즘 계속 바쁘고 정신이 없어서 여러 가지가 걱정인데 그래서 대체 언제쯤 괜찮아질까?'
  assert(question.length > 28, '긴 질문 준비')
  assert(detectIntent(question, '기타') === '시기', '29자 뒤의 "언제"를 찾지 못함')
})

test('회복·찾기 뜻은 알맞은 주제에서만 쓴다', () => {
  assert(detectIntent('관계가 좋아질까?', '연애') !== '회복', '연애 질문이 회복으로 읽힘')
  assert(detectIntent('새 직장이 나올까?', '사업') !== '찾기', '사업 질문이 찾기로 읽힘')
})

// ── 2) 같은 입력 → 같은 결과 ──────────────────────────────────
test('같은 입력이면 정밀 분석도 항상 똑같다', () => {
  const input = {
    askedAt: new Date(2026, 8, 3, 21, 5),
    category: '분실이동' as LiurenCategory,
    question: '지갑이 어디에 있을까?',
  }
  const a = calculateLiurenReading(input)
  const b = calculateLiurenReading(input)
  assert(JSON.stringify(a.insight) === JSON.stringify(b.insight), '정밀 분석이 달라짐')
  assert(a.baseInterpretation === b.baseInterpretation, '기본 해설이 달라짐')
})

// ── 3) 모양 불변식 ───────────────────────────────────────────
test('점수 합 100 · 또렷함 1~3 · 근거 5개 이하 · 단서가 비지 않는다', () => {
  const types: QueryType[] = ['사업', '연애', '건강', '분실물', '여행', '기타']
  for (let i = 0; i < 400; i++) {
    const date = new Date(2024, 0, 1)
    date.setMinutes(date.getMinutes() + i * 1771)
    const queryType = types[i % types.length]
    const insight = computeInsight(calculateCoursePlat(date, queryType), '일반')
    const { positive, neutral, negative } = insight.adjusted

    assert(positive + neutral + negative === 100, `점수 합이 100이 아님(${date.toISOString()})`)
    assert([1, 2, 3].includes(insight.clarityLevel), '또렷함 범위')
    assert(insight.evidence.length <= 5, '근거가 5개를 넘음')
    assert(insight.placeClue.length > 0 && insight.timingClue.length > 0, '단서가 비어 있음')
    assert(new Set(insight.evidence).size === insight.evidence.length, '근거가 중복됨')
  }
})

test('주제가 다르면 같은 시각이라도 분위기 판정이 달라질 수 있다', () => {
  const categories: LiurenCategory[] = ['관계', '일사업', '분실이동']
  let differing = 0
  for (let i = 0; i < 200; i++) {
    const askedAt = new Date(2025, 0, 1, 0, 0)
    askedAt.setMinutes(askedAt.getMinutes() + i * 2203)
    const results = categories.map(category =>
      calculateLiurenReading({ askedAt, category, question: '테스트' }).classification
    )
    if (new Set(results).size > 1) differing++
  }
  assert(differing > 0, '주제 보정이 판정에 전혀 반영되지 않음')
})

// ── 4) 특정 구조와 단서를 정확히 읽는다 ───────────────────────
test('삼합(신·자·진)은 "한 편" 근거로 읽는다', () => {
  const insight = computeInsight(withTransmissions('기타', ['shen', 'zi', 'chen']), '일반')
  assert(insight.evidence.some(e => e.includes('한 편')), '삼합 근거 없음')
})

test('충(자·오)은 "정면으로 부딪힘" 근거로 읽는다', () => {
  const insight = computeInsight(withTransmissions('기타', ['zi', 'wu', 'mao']), '일반')
  assert(insight.evidence.some(e => e.includes('정면')), '충 근거 없음')
})

test('분실물 단서는 마무리 칸의 방향과 장소로 정한다', () => {
  const insight = computeInsight(withTransmissions('분실물', ['mao', 'si', 'zi']), '장소')
  assert(insight.placeClue.includes('북쪽'), `방향: ${insight.placeClue}`)
  assert(insight.placeClue.includes('물이 가까운'), `장소: ${insight.placeClue}`)
})

test('물건을 뜻하는 칸이 있으면 그 칸을 단서로 삼는다', () => {
  const base = withTransmissions('분실물', ['mao', 'si', 'zi'])
  const result: CoursePlatResult = {
    ...base,
    threeTransmissions: base.threeTransmissions.map((t, i) =>
      i === 0 ? { ...t, relation: '재성' as const } : t
    ) as CoursePlatResult['threeTransmissions'],
  }
  const insight = computeInsight(result, '장소')
  assert(insight.placeClue.includes('동쪽'), `재성 칸(묘) 방향: ${insight.placeClue}`)
})

test('시기 단서는 마무리 칸의 시간대와 달을 알려 준다', () => {
  const insight = computeInsight(withTransmissions('기타', ['zi', 'chou', 'mao']), '시기')
  assert(insight.timingClue.includes('아침 5~7시'), `시간대: ${insight.timingClue}`)
  assert(insight.timingClue.includes('3월'), `달: ${insight.timingClue}`)
  assert(insight.timingSpeed.includes('가까운 때'), `빠르기: ${insight.timingSpeed}`)
})

test('단서 상자는 필요한 질문에서만 해설에 나온다', () => {
  const askedAt = new Date(2026, 6, 25, 9, 15)
  const lost = calculateLiurenReading({ askedAt, category: '분실이동', question: '잃어버린 지갑을 찾을 수 있을까?' })
  const timing = calculateLiurenReading({ askedAt, category: '관계', question: '언제 연락이 올까?' })
  const plain = calculateLiurenReading({ askedAt, category: '선택결정', question: '새 가방을 살까?' })

  assert(lost.baseInterpretation.includes('🧭 찾을 단서'), '분실 질문에 방향 단서가 없음')
  assert(timing.baseInterpretation.includes('⏰ 때 단서'), '시기 질문에 때 단서가 없음')
  assert(!plain.baseInterpretation.includes('단서'), '일반 질문에 단서가 붙음')
})

test('기본 해설은 여전히 답·이유·할 일 세 덩어리다', () => {
  const askedAt = new Date(2026, 6, 25, 9, 15)
  for (const question of ['지갑이 어디에 있을까?', '언제 만날까?', '합격할 수 있을까?', '그냥 궁금해요']) {
    const reading = calculateLiurenReading({ askedAt, category: '기타', question })
    assert(reading.baseInterpretation.split('\n\n').length === 3, `"${question}" 덩어리 수`)
  }
})

export async function run(): Promise<number> {
  console.log(`\n정밀 분석 테스트 결과: ${passed}개 통과, ${failed}개 실패\n`)
  if (failures.length > 0) {
    console.log(failures.join('\n\n'))
    console.log('')
  }
  return failed
}
