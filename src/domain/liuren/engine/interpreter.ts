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
import type { CoursePlatResult } from '../types'

interface CourseEntry {
  number: number
  summary?: string
  general: string
  focus?: string
  advice?: string
  byQuery: Record<string, string>
}

type ReadingClassification =
  | '긍정 우세' | '신중한 긍정' | '중립' | '변수 많음' | '주의 필요'

export interface InterpretationContext {
  question: string
  classification: ReadingClassification
}

function shortenQuestion(question: string): string {
  const normalized = question.trim().replace(/\s+/g, ' ')
  return normalized.length > 28 ? `${normalized.slice(0, 27)}…` : normalized
}

function answerByTone(
  classification: ReadingClassification,
  answers: Record<ReadingClassification, string>
): string {
  return answers[classification]
}

/** 질문에서 묻는 뜻을 찾아 계산 결과에 맞는 첫 답을 만든다. */
function buildDirectAnswer(context: InterpretationContext): string {
  const question = shortenQuestion(context.question)
  if (!question) return ''

  let answer: string
  if (/즐겁|재미|행복|기분\s*좋/.test(question)) {
    answer = answerByTone(context.classification, {
      '긍정 우세': '즐거운 시간이 될 흐름이 강해요.',
      '신중한 긍정': '즐거울 수 있지만 서로의 반응을 살피는 게 좋아요.',
      '중립': '즐거움과 어색함이 함께 있어 분위기를 만들어야 해요.',
      '변수 많음': '즐거울지는 그날의 대화에 따라 달라질 수 있어요.',
      '주의 필요': '기대만큼 즐겁지 않을 수 있어 무리하지 않는 게 좋아요.'
    })
  } else if (/언제|시기|몇\s*(월|일)|어느\s*때/.test(question)) {
    answer = answerByTone(context.classification, {
      '긍정 우세': '가까운 때에 움직일 흐름이 보여요.',
      '신중한 긍정': '조금 기다리면 알맞은 때가 보여요.',
      '중립': '아직 정확한 때가 뚜렷하지 않아요.',
      '변수 많음': '상황이 자주 바뀌어 때를 정하기 어려워요.',
      '주의 필요': '지금 정한 때는 미루는 편이 좋아요.'
    })
  } else if (/해도|할까|해야|고를|선택|결정|옮길까|갈까/.test(question)) {
    answer = answerByTone(context.classification, {
      '긍정 우세': '해보는 쪽으로 움직여도 좋아요.',
      '신중한 긍정': '해도 괜찮지만 작은 것부터 시작하세요.',
      '중립': '지금은 어느 쪽도 뚜렷하지 않아 조건을 더 보세요.',
      '변수 많음': '바로 정하기보다 바뀔 조건을 먼저 확인하세요.',
      '주의 필요': '지금은 밀어붙이지 말고 다시 생각하는 게 좋아요.'
    })
  } else if (/마음|좋아할|사랑|관계|만남/.test(question)) {
    answer = answerByTone(context.classification, {
      '긍정 우세': '관계가 좋은 쪽으로 이어질 흐름이에요.',
      '신중한 긍정': '관계는 좋아질 수 있지만 천천히 다가가세요.',
      '중립': '서로의 마음이 아직 뚜렷하지 않아요.',
      '변수 많음': '상대의 반응에 따라 관계가 달라질 수 있어요.',
      '주의 필요': '지금은 관계를 억지로 끌고 가지 않는 게 좋아요.'
    })
  } else {
    answer = answerByTone(context.classification, {
      '긍정 우세': '바라는 쪽으로 흐를 가능성이 커요.',
      '신중한 긍정': '좋은 쪽에 가깝지만 서두르지 않는 게 좋아요.',
      '중립': '좋고 나쁨이 아직 뚜렷하지 않아요.',
      '변수 많음': '지금은 답이 바뀔 수 있어 조금 더 지켜봐야 해요.',
      '주의 필요': '지금은 기대한 방향으로 밀기 어려워 보여요.'
    })
  }

  return `“${question}”에 답하면, ${answer}`
}

/**
 * 과전 데이터를 기반으로 로컬 해석 텍스트를 만든다.
 */
export function buildFallbackInterpretation(
  result: CoursePlatResult,
  context?: InterpretationContext
): string {
  const courses = coursesData as Record<string, CourseEntry>

  const courseEntry = courses[result.courseName]
  const summaryText = courseEntry?.summary
    ?? '지금 흐름을 차분히 살펴보라는 뜻이에요.'
  const adviceText = courseEntry?.advice ?? courseEntry?.focus ?? ''
  const queryText = courseEntry?.byQuery?.[result.queryType] ?? ''
  const directAnswer = context ? buildDirectAnswer(context) : ''

  const parts = [
    directAnswer ? `💬 질문에 대한 답\n${directAnswer}` : `📌 한눈에 보기\n${summaryText}`,
    `🔎 그렇게 본 이유\n${summaryText}${queryText ? ` ${queryText}` : ''}`,
    adviceText ? `✅ 지금 할 일\n${adviceText}` : ''
  ].filter(Boolean)

  return parts.join('\n\n')
}
