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
function buildFallbackDetail(reading: LiurenReading): DetailReading {
  const { firstTransmission, middleTransmission, finalTransmission, classification, raw } = reading

  const doNow: string[] = []
  const avoid: string[] = []
  const expectedVariables: string[] = []

  if (!firstTransmission.isVoid) {
    doNow.push('일의 시작 부분에 힘이 실려 있으니 지금 바로 첫걸음을 떼 보세요.')
  } else {
    avoid.push('일의 시작 부분이 아직 비어 있어, 지금 서둘러 확정 짓는 것은 피하세요.')
  }

  if (middleTransmission.strength === '수' || middleTransmission.strength === '사') {
    expectedVariables.push('일이 진행되는 중간에 힘이 약해지는 구간이 있어 예상보다 더뎌질 수 있습니다.')
  } else {
    doNow.push('일의 중간 흐름이 나쁘지 않으니 중간 점검을 미루지 마세요.')
  }

  if (finalTransmission.isVoid) {
    expectedVariables.push('일의 마무리 부분이 아직 정해지지 않아 결론이 한 번 더 바뀔 수 있습니다.')
  }

  if (raw.patternNames.includes('반음과') || raw.patternNames.includes('섭해과')) {
    expectedVariables.push('상황이 뒤집히거나 방해가 끼어들 수 있는 흐름입니다.')
  }

  if (doNow.length === 0) doNow.push('무리하게 밀어붙이기보다 상황을 한 번 더 점검하세요.')
  if (avoid.length === 0) avoid.push('성급한 확정과 감정적인 결정은 피하세요.')
  if (expectedVariables.length === 0) expectedVariables.push('큰 변수 없이 흐름대로 진행될 가능성이 큽니다.')

  const oneLineConclusion = `지금은 "${classification}" 흐름이니, ${doNow[0]}`

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
