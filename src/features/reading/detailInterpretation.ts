/**
 * features/reading/detailInterpretation.ts
 * 심화 해석(상세) 생성 — 보상형 광고 시청 후에만 화면에 노출한다(호출 자체는 자유).
 *
 * AI 해석 서버가 아직 없어도 앱이 정상 동작하도록 인터페이스와 로컬 fallback만 둔다.
 * AI_API_ENDPOINT/AI_API_SECRET 은 서버 전용 값이므로 이 클라이언트 코드에서는
 * 절대 직접 호출하지 않는다(추후 서버리스 함수 등 백엔드 프록시를 통해서만 연결한다).
 */
import type { LiurenReading } from '../../domain/liuren/calculateLiurenReading'
import type { HeavenlyGeneral, QueryType } from '../../domain/liuren/types'
import generalsData from '../../domain/liuren/data/generals.json'
import coursesData from '../../domain/liuren/data/courses.json'

export type DetailStatus = 'ai' | 'fallback'

export interface DetailReading {
  status: DetailStatus
  /** 상세 해석 본문 */
  detailText: string
  /** 시작·중간·마무리 단계별 이야기 */
  stageStory: string[]
  /** 나 쪽 · 상대 쪽 자리 설명 */
  sides: string[]
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

interface GeneralEntry {
  inInitial: string
  inMiddle: string
  inFinal: string
  advice: string
}

type Mood = 'good' | 'careful'

/** 주제별로 분위기에 맞는 "할 일 · 피할 일" 한 줄씩 */
const TOPIC_TIPS: Record<QueryType, Record<Mood, { doNow: string; avoid: string }>> = {
  사업: {
    good: { doNow: '계획이나 제안을 정리해서 먼저 내밀어 보세요.', avoid: '조건을 확인하지 않고 한꺼번에 크게 벌이는 일은 피하세요.' },
    careful: { doNow: '돈이나 계약 이야기는 한 번 더 읽고 정하세요.', avoid: '서두른 계약이나 큰 투자는 피하세요.' },
  },
  연애: {
    good: { doNow: '솔직하고 부드러운 말로 먼저 다가가 보세요.', avoid: '상대의 마음을 앞서 짐작하고 몰아붙이지 마세요.' },
    careful: { doNow: '연락은 가볍게 하고 상대의 속도를 기다리세요.', avoid: '감정이 클 때 보내는 긴 메시지는 피하세요.' },
  },
  건강: {
    good: { doNow: '규칙적으로 자고 먹으며 가벼운 운동을 이어 가세요.', avoid: '좋아졌다고 갑자기 무리하는 일은 피하세요.' },
    careful: { doNow: '증상을 기록하고 어른이나 의사 선생님께 먼저 알리세요.', avoid: '스스로 약을 정하거나 아픈 것을 참는 일은 피하세요.' },
  },
  분실물: {
    good: { doNow: '마지막으로 쓴 자리부터 차근차근 되짚어 보세요.', avoid: '같은 곳을 급하게 여러 번 뒤지는 일은 피하세요.' },
    careful: { doNow: '가족이나 친구에게 물어보고 잠시 쉬었다 다시 찾으세요.', avoid: '확인 없이 누군가를 의심하는 일은 피하세요.' },
  },
  여행: {
    good: { doNow: '시간과 준비물을 미리 정리하고 출발하세요.', avoid: '일정을 빽빽하게 채우는 일은 피하세요.' },
    careful: { doNow: '예약과 날씨, 이동 방법을 한 번 더 확인하세요.', avoid: '서두른 출발이나 무리한 이동은 피하세요.' },
  },
  기타: {
    good: { doNow: '작게 먼저 해 보고 반응을 확인하세요.', avoid: '한 번에 모든 것을 정하려는 일은 피하세요.' },
    careful: { doNow: '정보를 더 모으고 믿을 만한 사람과 이야기하세요.', avoid: '기분만으로 서둘러 정하는 일은 피하세요.' },
  },
}

const STAGE_ICON = ['🌱 시작', '🔄 중간', '🏁 마무리'] as const

function buildFallbackDetail(reading: LiurenReading): DetailReading {
  const { firstTransmission, middleTransmission, finalTransmission, classification, raw, insight } = reading
  const generals = generalsData as Record<HeavenlyGeneral, GeneralEntry>
  const courses = coursesData as Record<string, { advice?: string }>
  const mood: Mood = classification === '긍정 우세' || classification === '신중한 긍정' ? 'good' : 'careful'
  const tips = TOPIC_TIPS[raw.queryType][mood]

  const doNow: string[] = [tips.doNow]
  const avoid: string[] = [tips.avoid]
  const expectedVariables: string[] = []

  // 단계별 이야기 — 각 단계에 앉은 기운 카드의 뜻을 그대로 풀어 준다
  const stageStory = [
    `${STAGE_ICON[0]}: ${generals[firstTransmission.general].inInitial}`,
    `${STAGE_ICON[1]}: ${generals[middleTransmission.general].inMiddle}`,
    `${STAGE_ICON[2]}: ${generals[finalTransmission.general].inFinal}`,
  ]

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

  if (raw.patternNames.includes('반음과') || raw.courseName === '반음과' || raw.courseName === '섭해과') {
    expectedVariables.push('상황이 뒤집히거나 방해가 끼어들 수 있어요.')
  }

  // 마무리 기운 카드가 주는 한 줄 조언 — 결말에 가장 큰 무게를 둔다
  const finalAdvice = generals[finalTransmission.general].advice
  if (mood === 'good') doNow.push(finalAdvice)
  else avoid.push(`마무리 카드의 조언: ${finalAdvice}`)

  if (insight.trend === 'falling') {
    expectedVariables.push('끝으로 갈수록 힘이 빠져요. 중간에 한 번 더 점검하세요.')
  } else if (insight.trend === 'rising') {
    doNow.push('끝으로 갈수록 힘이 붙어요. 초반에 조급해하지 마세요.')
  }

  const courseAdvice = courses[raw.courseName]?.advice
  if (courseAdvice) doNow.push(courseAdvice)

  if (expectedVariables.length === 0) expectedVariables.push('큰 변화 없이 흐름대로 갈 가능성이 커요.')

  const moodTitle = MOOD_TITLE[classification]
  const oneLineConclusion = `지금은 "${moodTitle}" 때예요. ${doNow[0]}`
  const detailText = finalTransmission.isVoid
    ? '마지막 흐름이 아직 비어 있어, 결론이 한 번 바뀔 수 있어요.'
    : finalTransmission.strength === '수' || finalTransmission.strength === '사'
      ? '마지막으로 갈수록 힘이 약해져, 천천히 확인하며 가는 게 좋아요.'
      : '마지막까지 힘이 이어져, 준비한 일을 차근차근 해볼 만해요.'

  return {
    status: 'fallback',
    detailText,
    stageStory,
    sides: [`🙋 나: ${insight.mySide}`, `🤝 상대: ${insight.otherSide}`],
    doNow: doNow.slice(0, 4),
    avoid: avoid.slice(0, 3),
    expectedVariables: expectedVariables.slice(0, 3),
    oneLineConclusion,
  }
}

/** 심화 해석을 만든다. AI가 준비되지 않았다면 자동으로 로컬 fallback을 사용한다. */
export async function getDetailReading(reading: LiurenReading): Promise<DetailReading> {
  const aiResult = await tryAiDetail(reading)
  if (aiResult) return aiResult
  return buildFallbackDetail(reading)
}
