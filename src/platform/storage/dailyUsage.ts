/**
 * platform/storage/dailyUsage.ts
 * 하루 이용 상태(로컬 저장) — Asia/Seoul(KST) 날짜를 기준으로 리셋한다.
 *
 * 정책 (기획서 9장)
 *  - 하루 첫 질문의 기본 해석: 무료
 *  - 첫 질문의 상세 해석: 보상형 광고 시청 후 열람
 *  - 하루 추가 질문 1회: 보상형 광고 시청 후 질문 가능
 *  - 추가 질문의 상세 해석도 동일하게 보상형 광고 시청 후 열람
 *
 * 새로고침으로 우회할 수 없도록 상태를 localStorage에 저장하고,
 * 날짜가 실제로 바뀐 경우에만(KST 기준) 초기화한다.
 */

const STORAGE_KEY = 'today-liuren:daily-usage:v1'

export interface DailyUsageState {
  /** KST 기준 'YYYY-MM-DD' */
  date: string
  askedFirstQuestion: boolean
  firstDetailUnlocked: boolean
  extraQuestionUnlocked: boolean
  askedExtraQuestion: boolean
  extraDetailUnlocked: boolean
}

/** 시스템 시간대와 무관하게 항상 Asia/Seoul 기준 오늘 날짜를 구한다. */
export function getKSTDateString(date: Date = new Date()): string {
  // en-CA 로케일은 YYYY-MM-DD 형식을 반환한다.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date)
}

function emptyState(date: string): DailyUsageState {
  return {
    date,
    askedFirstQuestion: false,
    firstDetailUnlocked: false,
    extraQuestionUnlocked: false,
    askedExtraQuestion: false,
    extraDetailUnlocked: false,
  }
}

/** 저장된 상태를 불러온다. 날짜가 바뀌었으면 새 하루로 초기화한다. */
export function loadDailyUsage(): DailyUsageState {
  const today = getKSTDateString()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState(today)
    const parsed = JSON.parse(raw) as DailyUsageState
    if (parsed.date !== today) return emptyState(today)
    return parsed
  } catch {
    return emptyState(today)
  }
}

function save(state: DailyUsageState): DailyUsageState {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage를 못 쓰는 환경(사생활 보호 모드 등) — 메모리 상태만으로 동작
  }
  return state
}

export function canAskFirstQuestion(state: DailyUsageState): boolean {
  return !state.askedFirstQuestion
}

export function canAskExtraQuestion(state: DailyUsageState): boolean {
  return state.askedFirstQuestion && !state.askedExtraQuestion
}

export function markFirstQuestionAsked(state: DailyUsageState): DailyUsageState {
  return save({ ...state, askedFirstQuestion: true })
}

export function markExtraQuestionAsked(state: DailyUsageState): DailyUsageState {
  return save({ ...state, askedExtraQuestion: true })
}

export function unlockExtraQuestion(state: DailyUsageState): DailyUsageState {
  return save({ ...state, extraQuestionUnlocked: true })
}

export function unlockFirstDetail(state: DailyUsageState): DailyUsageState {
  return save({ ...state, firstDetailUnlocked: true })
}

export function unlockExtraDetail(state: DailyUsageState): DailyUsageState {
  return save({ ...state, extraDetailUnlocked: true })
}
