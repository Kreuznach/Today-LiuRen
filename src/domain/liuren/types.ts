/**
 * types.ts — 육임(六壬) 엔진 공용 타입
 * Rimora(D:\Projects\CodingLan\Rimora) 원본 계산 로직을 그대로 이식했다.
 */
export type Branch = 'zi'|'chou'|'yin'|'mao'|'chen'|'si'|
                     'wu'|'wei'|'shen'|'you'|'xu'|'hai'

export type Stem = 'jia'|'yi'|'bing'|'ding'|'wu'|
                   'ji'|'geng'|'xin'|'ren'|'gui'

/** 오행(五行) */
export type Element = '목'|'화'|'토'|'금'|'수'

/** 왕상휴수사(旺相休囚死) — 지지가 계절에서 얻는 힘의 세기 */
export type Strength = '왕'|'상'|'휴'|'수'|'사'

/** 일간(나)을 기준으로 본 지지의 역할 */
export type Relation = '비겁'|'식상'|'재성'|'관귀'|'인수'

/** 삼전 자리 이름 */
export type TransmissionPosition = '초전'|'중전'|'말전'

export type HeavenlyGeneral =
  '귀인'|'등사'|'주작'|'육합'|'구진'|'청룡'|
  '천공'|'백호'|'태상'|'현무'|'태음'|'천후'

/**
 * 육임 엔진 내부에서 쓰는 질문 유형.
 * Rimora 원본의 6종 분류를 그대로 유지한다 (courses.json의 byQuery 키와 1:1 대응).
 * 화면에 노출되는 5개 사용자 카테고리는 features/question/categories.ts 에서
 * 이 타입으로 매핑한다.
 */
export type QueryType = '사업'|'연애'|'건강'|'분실물'|'여행'|'기타'

export interface CoursePlatResult {
  date: Date
  /** 일간(日干) */
  dayStem: Stem
  /** 일지(日支) */
  dayBranch: Branch
  /** 점시(占時) 지지 */
  hourBranch: Branch
  /** 절기 기준 월지(月支) */
  monthBranch: Branch
  /** 월장(月將) */
  yueJiang: Branch
  /** 낮(주귀) 여부 */
  isDay: boolean
  /** 공망(空亡) 지지 두 개 */
  voidBranches: Branch[]
  heavenPlate: Record<Branch, Branch>
  fourCourses: FourCourse[]
  threeTransmissions: Transmission[]
  /** 천반 지지 → 천장 */
  generalMap: Record<Branch, HeavenlyGeneral>
  /** 과체(課體) 이름 */
  courseName: string
  /** 초전을 정한 방법 이름 */
  methodName: string
  /** 부가 격(格) 이름 */
  patternNames: string[]
  queryType: QueryType
}

export interface FourCourse {
  index: 1|2|3|4
  heaven: Branch
  earth: Branch
}

export interface Transmission {
  position: TransmissionPosition
  branch: Branch
  general: HeavenlyGeneral
  strength: Strength
  /** 일간 기준 역할 */
  relation: Relation
  /** 공망에 걸렸는가 */
  isVoid: boolean
}
