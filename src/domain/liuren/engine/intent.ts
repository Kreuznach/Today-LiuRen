/**
 * intent.ts — 질문이 "무엇을 묻는지"(질문의 뜻)를 낱말 규칙으로 찾는 모듈
 *
 * 주제(연애·사업 …)는 questionKeywords.ts가 찾고,
 * 이 모듈은 같은 주제 안에서도 "언제?", "어디?", "될까?" 같은 물음의 모양을 찾는다.
 * AI 없이 규칙만 쓰므로 같은 질문은 언제나 같은 뜻으로 읽힌다.
 *
 * 주의: 질문 전체를 검사한다(예전처럼 앞부분만 잘라서 보지 않는다).
 */
import type { QueryType } from '../types'

export type QuestionIntent =
  | '시기' | '장소' | '찾기' | '즐거움' | '회복' | '선택' | '마음' | '결과' | '일반'

const RULES: Array<{ intent: QuestionIntent; pattern: RegExp; onlyFor?: QueryType[] }> = [
  { intent: '시기', pattern: /언제|시기|몇\s*(월|일|시)|어느\s*때|며칠|얼마\s*(후|뒤|지나)/ },
  { intent: '장소', pattern: /어디|어느\s*(쪽|방향|곳)|방향/ },
  { intent: '찾기', pattern: /찾을|되찾|돌아올|발견|나올까|나타날/, onlyFor: ['분실물'] },
  { intent: '즐거움', pattern: /즐거|즐겁|재미|행복|기분\s*좋/ },
  { intent: '회복', pattern: /나을|낫|회복|좋아질|괜찮아질|호전/, onlyFor: ['건강'] },
  { intent: '선택', pattern: /(해|가|사|봐|먹어|떠나|바꿔|해야|옮겨)도\s*(될까|되나|괜찮|좋을까)|(할|갈|살|볼|먹을|떠날|옮길|바꿀|보낼|만날|시작할)까|해야|고를|선택|결정|해도/ },
  { intent: '마음', pattern: /마음|좋아할|좋아하|호감|사랑|관계|만남|연락|답장|재회/ },
  { intent: '결과', pattern: /될까|될지|붙을|합격|성공|이뤄|이루어|받을|오를|늘어|올까|올지|가능|잘될/ },
]

/** 질문 전체에서 묻는 뜻을 찾는다. 규칙은 위에서부터 차례로 맞춰 본다. */
export function detectIntent(question: string, queryType: QueryType): QuestionIntent {
  const text = question.trim().replace(/\s+/g, ' ')
  for (const rule of RULES) {
    if (rule.onlyFor && !rule.onlyFor.includes(queryType)) continue
    if (rule.pattern.test(text)) return rule.intent
  }
  return '일반'
}
