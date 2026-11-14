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
import { detectIntent, type QuestionIntent } from './intent'
import type { ReadingInsight } from './insight'

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
  /** 주제 보정·단서·근거가 담긴 정밀 분석 (있으면 해설에 함께 쓴다) */
  insight?: ReadingInsight
  /** 미리 찾아 둔 질문의 뜻 (없으면 질문에서 직접 찾는다) */
  intent?: QuestionIntent
}

type ToneAnswers = Record<ReadingClassification, string>

/** 질문의 뜻별로 분위기에 맞는 첫 답. 질문 전체에서 뜻을 찾는다. */
const ANSWERS: Record<Exclude<QuestionIntent, '일반'>, ToneAnswers> = {
  즐거움: {
    '긍정 우세': '즐거운 시간이 될 흐름이 강해요.',
    '신중한 긍정': '즐거울 수 있지만 서로의 반응을 살피는 게 좋아요.',
    '중립': '즐거움과 어색함이 함께 있어 분위기를 만들어야 해요.',
    '변수 많음': '즐거울지는 그날의 대화에 따라 달라질 수 있어요.',
    '주의 필요': '기대만큼 즐겁지 않을 수 있어 무리하지 않는 게 좋아요.',
  },
  시기: {
    '긍정 우세': '가까운 때에 움직일 흐름이 보여요.',
    '신중한 긍정': '조금 기다리면 알맞은 때가 보여요.',
    '중립': '아직 정확한 때가 뚜렷하지 않아요.',
    '변수 많음': '상황이 자주 바뀌어 때를 정하기 어려워요.',
    '주의 필요': '지금 정한 때는 미루는 편이 좋아요.',
  },
  장소: {
    '긍정 우세': '단서가 뚜렷해서 살펴볼 곳을 좁힐 수 있어요.',
    '신중한 긍정': '단서가 있어요. 아래 방향부터 차근차근 살펴보세요.',
    '중립': '단서가 약해요. 아래 방향은 참고만 하세요.',
    '변수 많음': '단서가 자주 바뀌어요. 여러 곳을 열어 두고 보세요.',
    '주의 필요': '단서가 흐려요. 같은 곳을 다시 보거나 도움을 청하세요.',
  },
  찾기: {
    '긍정 우세': '찾을 가능성이 커요. 차근차근 다시 살펴보세요.',
    '신중한 긍정': '찾을 수 있어요. 다만 시간이 조금 걸릴 수 있어요.',
    '중립': '찾을지는 아직 뚜렷하지 않아요. 지나온 길을 되짚어 보세요.',
    '변수 많음': '있던 자리가 바뀌었을 수 있어요. 넓게 찾아보세요.',
    '주의 필요': '바로 찾기는 어려워 보여요. 여러 사람에게 물어보세요.',
  },
  회복: {
    '긍정 우세': '회복하는 쪽으로 힘이 붙고 있어요.',
    '신중한 긍정': '나아질 수 있어요. 무리하지 말고 쉬어 가세요.',
    '중립': '좋아지는지는 아직 뚜렷하지 않아요. 몸 상태를 기록하세요.',
    '변수 많음': '좋아졌다 나빠졌다 할 수 있어 꾸준히 살펴야 해요.',
    '주의 필요': '몸에 부담이 커 보여요. 어른과 의사 선생님께 꼭 확인하세요.',
  },
  선택: {
    '긍정 우세': '해보는 쪽으로 움직여도 좋아요.',
    '신중한 긍정': '해도 괜찮지만 작은 것부터 시작하세요.',
    '중립': '지금은 어느 쪽도 뚜렷하지 않아 조건을 더 보세요.',
    '변수 많음': '바로 정하기보다 바뀔 조건을 먼저 확인하세요.',
    '주의 필요': '지금은 밀어붙이지 말고 다시 생각하는 게 좋아요.',
  },
  마음: {
    '긍정 우세': '관계가 좋은 쪽으로 이어질 흐름이에요.',
    '신중한 긍정': '관계는 좋아질 수 있지만 천천히 다가가세요.',
    '중립': '서로의 마음이 아직 뚜렷하지 않아요.',
    '변수 많음': '상대의 반응에 따라 관계가 달라질 수 있어요.',
    '주의 필요': '지금은 관계를 억지로 끌고 가지 않는 게 좋아요.',
  },
  결과: {
    '긍정 우세': '원하는 쪽으로 이뤄질 가능성이 커요.',
    '신중한 긍정': '이뤄질 수 있지만 마무리까지 챙겨야 해요.',
    '중립': '될지 안 될지 아직 뚜렷하지 않아요.',
    '변수 많음': '중간에 바뀔 일이 있어 끝까지 지켜봐야 해요.',
    '주의 필요': '지금 방식으로는 어려울 수 있어 방법을 바꿔 보세요.',
  },
}

const GENERIC_ANSWERS: ToneAnswers = {
  '긍정 우세': '바라는 쪽으로 흐를 가능성이 커요.',
  '신중한 긍정': '좋은 쪽에 가깝지만 서두르지 않는 게 좋아요.',
  '중립': '좋고 나쁨이 아직 뚜렷하지 않아요.',
  '변수 많음': '지금은 답이 바뀔 수 있어 조금 더 지켜봐야 해요.',
  '주의 필요': '지금은 기대한 방향으로 밀기 어려워 보여요.',
}

function shortenQuestion(question: string): string {
  const normalized = question.trim().replace(/\s+/g, ' ')
  return normalized.length > 28 ? `${normalized.slice(0, 27)}…` : normalized
}

/** 질문의 뜻에 맞는 첫 답과, 필요하면 단서 한 줄을 만든다. */
function buildDirectAnswer(result: CoursePlatResult, context: InterpretationContext): string {
  const question = shortenQuestion(context.question)
  if (!question) return ''

  const intent = context.intent ?? detectIntent(context.question, result.queryType)
  const answers = intent === '일반' ? GENERIC_ANSWERS : ANSWERS[intent]
  const insight = context.insight
  // 시기 질문은 분위기보다 "마무리 칸의 힘"이 때의 빠르기를 정한다. 단, 조심 분위기는 그대로 알린다.
  const answer = intent === '시기' && insight && context.classification !== '주의 필요'
    ? insight.timingSpeed
    : answers[context.classification]
  const lines = [`“${question}”에 답하면, ${answer}`]

  if (insight?.showPlace) lines.push(`🧭 찾을 단서: ${insight.placeClue}`)
  if (insight?.showTiming) lines.push(`⏰ 때 단서: ${insight.timingClue}`)
  return lines.join('\n')
}

/** 이유 칸에 붙일 근거. 읽기가 흐릿하면 솔직하게 알려 준다. */
function buildEvidenceLines(insight?: ReadingInsight): string {
  if (!insight) return ''
  const lines = insight.evidence.slice(0, 2).map(text => `• ${text}`)
  if (insight.clarityLevel === 1) lines.push(`• ${insight.clarityHint}`)
  return lines.length > 0 ? `\n${lines.join('\n')}` : ''
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
  const directAnswer = context ? buildDirectAnswer(result, context) : ''

  const parts = [
    directAnswer ? `💬 질문에 대한 답\n${directAnswer}` : `📌 한눈에 보기\n${summaryText}`,
    `🔎 그렇게 본 이유\n${summaryText}${queryText ? ` ${queryText}` : ''}${buildEvidenceLines(context?.insight)}`,
    adviceText ? `✅ 지금 할 일\n${adviceText}` : ''
  ].filter(Boolean)

  return parts.join('\n\n')
}
