/**
 * calculateLiurenReading.ts — 육임 계산 엔진(domain/liuren/engine)을 감싸는 공개 API.
 *
 * UI(features/*)는 이 함수 하나만 호출해서 화면에 필요한 모든 데이터를 얻는다.
 * 계산 로직 자체는 Rimora(D:\Projects\CodingLan\Rimora) 원본을 그대로 이식했으며,
 * 이 파일은 결과를 앱 화면에 맞는 모양으로 다시 포장만 한다(계산값 변경 없음).
 */
import type { Branch, CoursePlatResult, QueryType, Transmission } from './types'
import { calculateCoursePlat } from './engine/coursePlate'
import { buildFallbackInterpretation } from './engine/interpreter'
import { computeStructureScore } from './engine/score'
import { BRANCHES } from './engine/elements'

/** 사용자가 실제로 고르는 5개 질문 카테고리 (기획서 8장 기준) */
export type LiurenCategory = '관계' | '일사업' | '선택결정' | '분실이동' | '기타'

/**
 * 화면 카테고리 → 엔진 내부 QueryType(Rimora 원본 6분류) 매핑.
 * courses.json의 byQuery 텍스트가 Rimora 원본 6분류를 기준으로 쓰여 있어,
 * 계산 결과 문구 품질을 지키기 위해 이 매핑을 거친다.
 */
const CATEGORY_TO_QUERY_TYPE: Record<LiurenCategory, QueryType> = {
  관계: '연애',
  일사업: '사업',
  선택결정: '기타',
  분실이동: '분실물',
  기타: '기타',
}

/** 통계적 확률로 오해되지 않도록 사용하는 텍스트 분류 (기획서 8장 기준) */
export type ReadingClassification =
  | '긍정 우세' | '신중한 긍정' | '중립' | '변수 많음' | '주의 필요'

/** 실제 계산된 기운 점수(score.ts)를 바탕으로 텍스트 분류를 정한다. 난수는 쓰지 않는다. */
function classify(result: CoursePlatResult): ReadingClassification {
  const { positive, neutral, negative } = computeStructureScore(result)
  const dominant = Math.max(positive, neutral, negative)

  if (dominant === negative && negative - Math.max(positive, neutral) >= 8) {
    return '주의 필요'
  }
  if (dominant === positive && positive - negative >= 15) {
    return '긍정 우세'
  }
  if (positive - negative >= 8) {
    return '신중한 긍정'
  }
  if (Math.abs(positive - negative) < 8 && neutral < 45) {
    return '변수 많음'
  }
  return '중립'
}

export interface LiurenReadingInput {
  /** 점을 치는 기준 시각(현재 시각 또는 사용자가 직접 지정한 점시) */
  askedAt: Date
  category: LiurenCategory
  question: string
}

export interface LiurenReading {
  askedAt: string
  /** 지반(地盤) — 늘 고정된 12지지 순서 */
  earthPlate: Branch[]
  /** 천반(天盤) — 지반 지지 → 그 위에 올라온 천반 지지 */
  heavenPlate: Record<Branch, Branch>
  /** 사과(四課) */
  fourLessons: CoursePlatResult['fourCourses']
  firstTransmission: Transmission   // 초전
  middleTransmission: Transmission  // 중전
  finalTransmission: Transmission   // 말전
  classification: ReadingClassification
  baseInterpretation: string
  /** 화면에 표시할 사용자 카테고리/질문 원문 */
  category: LiurenCategory
  question: string
  /** 과전도·용어 도움말 등 고급 화면에서 쓰는 원본 계산 결과 */
  raw: CoursePlatResult
}

/**
 * 하나의 질문(점시 + 카테고리 + 질문 텍스트)으로 육임 리딩 전체를 계산한다.
 * 같은 입력이면 항상 같은 결과가 나오는 순수 함수다.
 */
export function calculateLiurenReading(input: LiurenReadingInput): LiurenReading {
  const queryType = CATEGORY_TO_QUERY_TYPE[input.category]
  const result = calculateCoursePlat(input.askedAt, queryType)

  return {
    askedAt: input.askedAt.toISOString(),
    earthPlate: BRANCHES,
    heavenPlate: result.heavenPlate,
    fourLessons: result.fourCourses,
    firstTransmission: result.threeTransmissions[0],
    middleTransmission: result.threeTransmissions[1],
    finalTransmission: result.threeTransmissions[2],
    classification: classify(result),
    baseInterpretation: buildFallbackInterpretation(result),
    category: input.category,
    question: input.question,
    raw: result,
  }
}
