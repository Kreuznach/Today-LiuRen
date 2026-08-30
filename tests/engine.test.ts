/**
 * tests/engine.test.ts — 육임 계산 엔진 회귀 테스트
 *
 * 1) Rimora(D:\Projects\CodingLan\Rimora) 원본 엔진으로 미리 계산해 둔
 *    5개 대표 시각의 결과(tests/fixtures/rimora-golden-cases.json)와
 *    이식한 엔진의 결과가 완전히 같은지 확인한다("동일성 테스트").
 * 2) 어떤 시각을 넣어도 결과 형식이 깨지지 않는지(불변식) 확인한다.
 */
import goldenCases from './fixtures/rimora-golden-cases.json'
import coursesData from '../src/domain/liuren/data/courses.json'
import { QUESTION_KEYWORDS } from '../src/domain/liuren/data/questionKeywords'
import { calculateCoursePlat } from '../src/domain/liuren/engine/coursePlate'
import { calculateLiurenReading } from '../src/domain/liuren/calculateLiurenReading'

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

function deepEqual(actual: unknown, expected: unknown, label: string): void {
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  if (a !== b) throw new Error(`${label}: 기대값 ${b}, 실제값 ${a}`)
}

// ── 골든 케이스 — Rimora 원본과 동일한 결과가 나오는지 확인 ───────
interface GoldenCase {
  isoDate: string
  fourCourses: Array<{ index: number; heaven: string; earth: string }>
  threeTransmissions: Array<{
    position: string; branch: string; general: string; strength: string; relation: string; isVoid: boolean
  }>
  courseName: string
  methodName: string
  patternNames: string[]
}

const cases = goldenCases as Record<string, GoldenCase>

for (const [label, golden] of Object.entries(cases)) {
  test(`[golden:${label}] Rimora 원본과 동일한 사과·삼전·과체가 나온다`, () => {
    const date = new Date(golden.isoDate)
    const result = calculateCoursePlat(date, '기타')

    deepEqual(
      result.fourCourses.map(c => ({ index: c.index, heaven: c.heaven, earth: c.earth })),
      golden.fourCourses,
      '사과'
    )
    deepEqual(
      result.threeTransmissions.map(t => ({
        position: t.position, branch: t.branch, general: t.general,
        strength: t.strength, relation: t.relation, isVoid: t.isVoid
      })),
      golden.threeTransmissions,
      '삼전'
    )
    assert(result.courseName === golden.courseName, `과체: 기대값 ${golden.courseName}, 실제값 ${result.courseName}`)
    assert(result.methodName === golden.methodName, `발용법: 기대값 ${golden.methodName}, 실제값 ${result.methodName}`)
    deepEqual(result.patternNames, golden.patternNames, '부가 격')
  })
}

// ── 자정 경계 — 23:50과 다음날 00:10이 같은 일진/점시를 쓰는지 ─────
test('밤 23시 50분과 다음 날 0시 10분은 같은 결과를 낸다(야자시 규칙)', () => {
  const a = cases['before-midnight']
  const b = cases['after-midnight']
  deepEqual(a.fourCourses, b.fourCourses, '사과')
  deepEqual(a.threeTransmissions, b.threeTransmissions, '삼전')
})

// ── 불변식 — 어떤 시각을 넣어도 형식이 깨지지 않는다 ───────────────
test('과전 결과는 어떤 시각에도 형식이 깨지지 않는다', () => {
  for (let i = 0; i < 300; i++) {
    const date = new Date(2020, 0, 1)
    date.setMinutes(date.getMinutes() + i * 997)

    const r = calculateCoursePlat(date, '사업')

    assert(r.threeTransmissions.length === 3, '삼전 개수')
    assert(r.fourCourses.length === 4, '사과 개수')
    assert(r.voidBranches.length === 2, '공망 개수')
  }
})

test('과체 이름은 항상 해석 사전(courses.json)에 존재한다', () => {
  const dictionary = coursesData as Record<string, unknown>
  const missing = new Set<string>()

  for (let day = 0; day < 60; day++) {
    for (let hour = 0; hour < 24; hour += 3) {
      const date = new Date(2026, 0, 1 + day, hour, 30)
      const result = calculateCoursePlat(date, '기타')
      if (!(result.courseName in dictionary)) missing.add(result.courseName)
    }
  }
  assert(missing.size === 0, `사전에 없는 과체: ${[...missing].join(', ')}`)
})

// ── calculateLiurenReading — 화면에서 쓰는 공개 API 스모크 테스트 ──
test('calculateLiurenReading은 5개 카테고리 모두에서 정상 동작한다', () => {
  const categories = ['관계', '일사업', '선택결정', '분실이동', '기타'] as const
  for (const category of categories) {
    const reading = calculateLiurenReading({
      askedAt: new Date(2026, 6, 25, 9, 15),
      category,
      question: '테스트 질문',
    })
    assert(reading.baseInterpretation.length > 0, `${category} 기본 해석 생성`)
    assert(
      ['긍정 우세', '신중한 긍정', '중립', '변수 많음', '주의 필요'].includes(reading.classification),
      `${category} 분류값이 5종 중 하나`
    )
  }
})

test('기본 해설은 사용자의 질문에 직접 답한다', () => {
  const askedAt = new Date(2026, 6, 25, 9, 15)
  const meeting = calculateLiurenReading({
    askedAt,
    category: '관계',
    question: '내일 만남이 즐거울까?',
  })
  const timing = calculateLiurenReading({
    askedAt,
    category: '관계',
    question: '언제 다시 만나는 게 좋을까?',
  })

  assert(meeting.baseInterpretation.includes('내일 만남이 즐거울까?'), '질문 원문 표시')
  assert(meeting.baseInterpretation.includes('즐거'), '즐거움에 대한 직접 답')
  assert(meeting.raw.queryType === '연애', '질문 속 만남 단서로 관계 해석 선택')
  assert(timing.baseInterpretation.includes('때'), '시기에 대한 직접 답')
  assert(meeting.baseInterpretation !== timing.baseInterpretation, '질문에 따라 달라지는 답')
  assert(
    meeting.baseInterpretation.split('\n\n').length === 3,
    '기본 해설은 답·이유·행동 세 부분으로 구성'
  )
})

test('질문의 다양한 표현을 알맞은 해석 종류로 찾는다', () => {
  const askedAt = new Date(2026, 6, 25, 9, 15)
  const cases = [
    ['헤어진 남자친구와 재회할 수 있을까?', '연애'],
    ['소개팅 상대가 나에게 호감이 있을까?', '연애'],
    ['이번 면접에 합격해서 이직할 수 있을까?', '사업'],
    ['가게 매출과 수익이 늘어날까?', '사업'],
    ['두고 온 지갑을 되찾을 수 있을까?', '분실물'],
    ['휴대폰이 어디에 있을까?', '분실물'],
    ['다음 달 해외여행을 떠나도 될까?', '여행'],
    ['부산으로 이사할 시기가 좋을까?', '여행'],
    ['허리 통증이 치료 후 회복될까?', '건강'],
    ['요즘 잠을 잘 못 자는데 건강이 좋아질까?', '건강'],
    ['새 가방을 살까?', '기타'],
    ['내일 친구와 밥을 먹으러 갈까?', '기타'],
  ] as const

  for (const [question, expected] of cases) {
    const reading = calculateLiurenReading({ askedAt, category: '기타', question })
    assert(
      reading.raw.queryType === expected,
      `"${question}" 분류: 기대값 ${expected}, 실제값 ${reading.raw.queryType}`
    )
  }
})

test('질문 주제 사전은 종류별로 충분하고 중복된 낱말이 없다', () => {
  for (const [queryType, entry] of Object.entries(QUESTION_KEYWORDS)) {
    assert(entry.keywords.length >= 15, `${queryType} 낱말이 15개보다 적음`)
    assert(entry.phrases.length >= 3, `${queryType} 복합 표현이 3개보다 적음`)
    assert(
      new Set(entry.keywords).size === entry.keywords.length,
      `${queryType} 사전에 중복된 낱말이 있음`
    )
  }
})

test('분실·이동 카테고리 안에서 질문에 맞는 설명을 고른다', () => {
  const askedAt = new Date(2026, 6, 25, 9, 15)
  const lostItem = calculateLiurenReading({
    askedAt,
    category: '분실이동',
    question: '잃어버린 열쇠를 찾을 수 있을까?',
  })
  const travel = calculateLiurenReading({
    askedAt,
    category: '분실이동',
    question: '다음 주에 제주 여행을 떠나도 될까?',
  })

  assert(lostItem.raw.queryType === '분실물', '분실 질문은 분실물 설명 선택')
  assert(travel.raw.queryType === '여행', '이동 질문은 여행 설명 선택')
})

export async function run(): Promise<number> {
  console.log(`\n육임 엔진 테스트 결과: ${passed}개 통과, ${failed}개 실패\n`)
  if (failures.length > 0) {
    console.log(failures.join('\n\n'))
    console.log('')
  }
  return failed
}
