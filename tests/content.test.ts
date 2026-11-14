/**
 * tests/content.test.ts — 사용자에게 보이는 글이 "쉬운 말"인지 확인하는 테스트
 *
 * 목표: 초등학교 고학년(12살)이 읽어도 이해할 수 있는 글만 화면에 나가게 한다.
 *   1) 한자가 섞여 있으면 안 된다.
 *   2) 점술 전문 용어(과체·삼전·공망 …)가 그대로 나오면 안 된다.
 *   3) 한 문장이 너무 길면 안 된다.
 *   4) 화면에 쓰는 쉬운 말은 모두 "어려운 말 풀이"에 설명이 있어야 한다.
 */
import coursesData from '../src/domain/liuren/data/courses.json'
import generalsData from '../src/domain/liuren/data/generals.json'
import { GLOSSARY, GLOSSARY_ORDER } from '../src/domain/liuren/data/glossary'
import { buildFallbackInterpretation } from '../src/domain/liuren/engine/interpreter'
import { calculateCoursePlat } from '../src/domain/liuren/engine/coursePlate'
import { calculateLiurenReading, type LiurenCategory } from '../src/domain/liuren/calculateLiurenReading'
import { getDetailReading } from '../src/features/reading/detailInterpretation'

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

const asyncTests: Array<[string, () => Promise<void>]> = []
function testAsync(name: string, fn: () => Promise<void>): void {
  asyncTests.push([name, fn])
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

/** 한자(중국 한자 영역) */
const HANJA = /[\u3400-\u4DBF\u4E00-\u9FFF]/

/** 화면에 그대로 나오면 안 되는 점술 전문 용어 */
const HARD_TERMS = [
  '과체', '발용법', '과전도', '천반', '지반', '사과', '삼전',
  '초전', '중전', '말전', '천장', '공망', '일간', '점시',
  '왕상휴수사', '오행', '상생', '상극',
]

/** 한 문장 최대 길이(글자 수) */
const MAX_SENTENCE_LENGTH = 70

function splitSentences(text: string): string[] {
  return text
    .split('\n')
    .flatMap(line => line.split(/(?<=[.!?])\s+/))
    .map(s => s.trim())
    .filter(Boolean)
}

/** 사용자에게 보이는 글 한 덩어리를 세 가지 규칙으로 검사한다 */
function checkPlainKorean(label: string, text: string): void {
  const hanja = text.match(HANJA)
  assert(hanja === null, `${label}: 한자 "${hanja?.[0]}"가 들어 있습니다 → ${text}`)

  for (const term of HARD_TERMS) {
    assert(!text.includes(term), `${label}: 어려운 용어 "${term}"가 들어 있습니다 → ${text}`)
  }

  for (const sentence of splitSentences(text)) {
    assert(
      sentence.length <= MAX_SENTENCE_LENGTH,
      `${label}: 문장이 ${sentence.length}자로 너무 깁니다(최대 ${MAX_SENTENCE_LENGTH}자) → ${sentence}`
    )
  }
}

// ── 1) 해석 사전(courses.json) ────────────────────────────────
interface CourseEntry {
  summary?: string
  general: string
  focus?: string
  advice?: string
  byQuery: Record<string, string>
}

test('해석 사전(courses.json)의 모든 문장이 쉬운 말이다', () => {
  const courses = coursesData as Record<string, CourseEntry>
  for (const [name, entry] of Object.entries(courses)) {
    for (const key of ['summary', 'general', 'focus', 'advice'] as const) {
      const value = entry[key]
      if (value) checkPlainKorean(`${name}.${key}`, value)
    }
    for (const [queryType, value] of Object.entries(entry.byQuery)) {
      checkPlainKorean(`${name}.byQuery.${queryType}`, value)
    }
  }
})

test('해석 사전에 옛 이름을 그대로 읽어 주는 문장이 남아 있지 않다', () => {
  const courses = coursesData as Record<string, CourseEntry>
  for (const [name, entry] of Object.entries(courses)) {
    assert(
      !entry.general.startsWith(name),
      `${name}: 해설이 옛 이름("${name}는 …")으로 시작합니다 → ${entry.general}`
    )
    assert(!entry.general.includes('과입니다'), `${name}: "과입니다" 표현이 남아 있습니다.`)
  }
})

// ── 2) 기운 카드 사전(generals.json) ──────────────────────────
interface GeneralEntry {
  inInitial: string
  inMiddle: string
  inFinal: string
}

test('기운 카드 사전(generals.json)의 단계별 문장이 쉬운 말이다', () => {
  const generals = generalsData as Record<string, GeneralEntry>
  for (const [name, entry] of Object.entries(generals)) {
    for (const key of ['inInitial', 'inMiddle', 'inFinal'] as const) {
      checkPlainKorean(`${name}.${key}`, entry[key])
    }
  }
})

// ── 3) 어려운 말 풀이(glossary) ───────────────────────────────
test('어려운 말 풀이는 목록과 설명이 서로 맞는다', () => {
  assert(
    GLOSSARY_ORDER.length === Object.keys(GLOSSARY).length,
    `풀이 개수 불일치: 목록 ${GLOSSARY_ORDER.length}개, 설명 ${Object.keys(GLOSSARY).length}개`
  )
  for (const term of GLOSSARY_ORDER) {
    assert(typeof GLOSSARY[term] === 'string', `"${term}"의 설명이 없습니다.`)
  }
})

test('화면에 쓰는 쉬운 말이 모두 풀이에 들어 있다', () => {
  const shownLabels = [
    '위 칸', '아래 칸', '네 칸 표', '기운 카드', '힘', '아직 빈 자리', '전체 모양 이름',
    '읽기의 또렷함', '단서',
  ]
  for (const label of shownLabels) {
    assert(label in GLOSSARY, `화면에 쓰는 "${label}"의 풀이가 없습니다.`)
  }
})

test('어려운 말 풀이 자체에는 한자가 없다', () => {
  for (const [term, description] of Object.entries(GLOSSARY)) {
    const hanja = description.match(HANJA)
    assert(hanja === null, `${term} 풀이에 한자 "${hanja?.[0]}"가 있습니다.`)
  }
})

// ── 4) 실제로 만들어지는 해석 글 ──────────────────────────────
test('여러 시각에서 만들어진 기본 해설이 모두 쉬운 말이다', () => {
  for (let day = 0; day < 60; day++) {
    for (let hour = 1; hour < 24; hour += 5) {
      const date = new Date(2026, 0, 1 + day, hour, 20)
      const text = buildFallbackInterpretation(calculateCoursePlat(date, '기타'))
      checkPlainKorean(`기본 해설(${date.toISOString()})`, text)
    }
  }
})

testAsync('여러 시각에서 만들어진 자세한 해설이 모두 쉬운 말이다', async () => {
  const categories = ['관계', '일사업', '선택결정', '분실이동', '기타'] as const
  for (let day = 0; day < 30; day++) {
    const date = new Date(2026, 3, 1 + day, 14, 40)
    for (const category of categories) {
      const reading = calculateLiurenReading({ askedAt: date, category, question: '테스트' })
      const detail = await getDetailReading(reading)

      const label = `자세한 해설(${category}, ${date.toISOString()})`
      checkPlainKorean(label, detail.detailText)
      checkPlainKorean(label, detail.oneLineConclusion)
      for (const line of [
        ...detail.doNow, ...detail.avoid, ...detail.expectedVariables,
        ...detail.stageStory, ...detail.sides,
      ]) {
        checkPlainKorean(label, line)
      }
    }
  }
})

// ── 5) 정밀 분석(insight) 문장 ────────────────────────────────
const SAMPLE_QUESTIONS: Array<[LiurenCategory, string]> = [
  ['분실이동', '잃어버린 지갑을 찾을 수 있을까?'],
  ['분실이동', '휴대폰이 어디에 있을까?'],
  ['관계', '언제 다시 연락이 올까?'],
  ['관계', '그 사람이 나를 좋아할까?'],
  ['일사업', '이번 면접에 합격할 수 있을까?'],
  ['기타', '허리 통증이 회복될까?'],
  ['선택결정', '새 가방을 살까?'],
]

test('정밀 분석(근거·자리·단서·또렷함)과 질문별 해설이 모두 쉬운 말이다', () => {
  for (let day = 0; day < 40; day++) {
    for (const [category, question] of SAMPLE_QUESTIONS) {
      const date = new Date(2026, 4, 1 + day, (day * 5) % 24, 10)
      const reading = calculateLiurenReading({ askedAt: date, category, question })
      const label = `정밀 분석(${question}, ${date.toISOString()})`
      const { insight } = reading

      checkPlainKorean(label, reading.baseInterpretation)
      checkPlainKorean(label, insight.mySide)
      checkPlainKorean(label, insight.otherSide)
      checkPlainKorean(label, insight.placeClue)
      checkPlainKorean(label, insight.timingClue)
      checkPlainKorean(label, insight.timingSpeed)
      checkPlainKorean(label, insight.clarityHint)
      checkPlainKorean(label, insight.clarityLabel)
      for (const line of insight.evidence) checkPlainKorean(label, line)
    }
  }
})

test('기운 카드 조언 문장도 쉬운 말이다', () => {
  for (const [name, entry] of Object.entries(generalsData as Record<string, { advice: string }>)) {
    checkPlainKorean(`${name}.advice`, entry.advice)
  }
})

export async function run(): Promise<number> {
  for (const [name, fn] of asyncTests) {
    try {
      await fn()
      passed++
    } catch (err) {
      failed++
      failures.push(`  ✗ ${name}\n      ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(`\n쉬운 말 콘텐츠 테스트 결과: ${passed}개 통과, ${failed}개 실패\n`)
  if (failures.length > 0) {
    console.log(failures.join('\n\n'))
    console.log('')
  }
  return failed
}
