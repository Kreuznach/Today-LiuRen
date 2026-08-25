/**
 * features/reading/detailInterpretation.ts
 * 심화 해석(상세) 생성 — 보상형 광고 시청 후에만 화면에 노출한다(호출 자체는 자유).
 *
 * AI 해석 서버가 아직 없어도 앱이 정상 동작하도록 인터페이스와 로컬 fallback만 둔다.
 * AI_API_ENDPOINT/AI_API_SECRET 은 서버 전용 값이므로 이 클라이언트 코드에서는
 * 절대 직접 호출하지 않는다(추후 서버리스 함수 등 백엔드 프록시를 통해서만 연결한다).
 */
import type { LiurenReading } from '../../domain/liuren/calculateLiurenReading'

export type DetailStatus = 'ai' | 'fallback'

export interface DetailReading {
  status: DetailStatus
  /** 상세 해석 본문 */
  detailText: string
  /** 지금 할 수 있는 행동 */
  doNow: string[]
  /** 피해야 할 행동 */
  avoid: string[]
  /** 예상되는 변수 */
  expectedVariables: string[]
  /** 한 문장 결론 */
  oneLineConclusion: string
}

/**
 * (준비 중) 서버의 AI 해석 API를 호출하는 자리.
 * 지금은 endpoint가 없으므로 항상 null을 반환해 fallback으로 넘어간다.
 */
async function tryAiDetail(_reading: LiurenReading): Promise<DetailReading | null> {
  // TODO: AI_API_ENDPOINT가 준비되면, 클라이언트가 아닌 서버(예: Cloudflare Functions,
  // Supabase Edge Function 등)를 통해 이 함수를 채운다. 비밀키는 서버에만 둔다.
  return null
}

/** 계산 결과만으로 만드는 로컬 심화 해석(AI 없이도 항상 동작) */
const MOOD_TITLE: Record<LiurenReading['classification'], string> = {
  '긍정 우세': '흐름이 좋아요',
  '신중한 긍정': '괜찮지만 천천히',
  '중립': '보통이에요',
  '변수 많음': '바뀔 수 있어요',
  '주의 필요': '조심하세요',
}

function buildFallbackDetail(reading: LiurenReading): DetailReading {
  const { firstTransmission, middleTransmission, finalTransmission, classification, raw } = reading

  const doNow: string[] = []
  const avoid: string[] = []
  const expectedVariables: string[] = []

  if (!firstTransmission.isVoid) {
    doNow.push('시작에 힘이 실려 있어요. 지금 바로 첫걸음을 떼 보세요.')
  } else {
    avoid.push('시작이 아직 비어 있어요. 지금 서둘러 결정하지 마세요.')
  }

  if (middleTransmission.strength === '수' || middleTransmission.strength === '사') {
    expectedVariables.push('중간에서 힘이 약해질 수 있어요. 생각보다 느려질 수 있어요.')
  } else {
    doNow.push('중간 흐름은 나쁘지 않아요. 중간 점검을 미루지 마세요.')
  }

  if (finalTransmission.isVoid) {
    expectedVariables.push('마무리가 아직 정해지지 않았어요. 결론이 한 번 더 바뀔 수 있어요.')
  }

  if (raw.patternNames.includes('반음과') || raw.patternNames.includes('섭해과')) {
    expectedVariables.push('상황이 뒤집히거나 방해가 끼어들 수 있어요.')
  }

  if (doNow.length === 0) doNow.push('무리하게 밀지 말고 상황을 한 번 더 살펴보세요.')
  if (avoid.length === 0) avoid.push('급하게 정하거나 기분대로 정하는 일은 피하세요.')
  if (expectedVariables.length === 0) expectedVariables.push('큰 변화 없이 흐름대로 갈 가능성이 커요.')

  const moodTitle = MOOD_TITLE[classification]
  const oneLineConclusion = `지금은 "${moodTitle}" 때예요. ${doNow[0]}`

  return {
    status: 'fallback',
    detailText: reading.baseInterpretation,
    doNow,
    avoid,
    expectedVariables,
    oneLineConclusion,
  }
}

/** 심화 해석을 만든다. AI가 준비되지 않았다면 자동으로 로컬 fallback을 사용한다. */
export async function getDetailReading(reading: LiurenReading): Promise<DetailReading> {
  const aiResult = await tryAiDetail(reading)
  if (aiResult) return aiResult
  return buildFallbackDetail(reading)
}
