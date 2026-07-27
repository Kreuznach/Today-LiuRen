/**
 * calendar.ts — 날짜/시각을 간지(干支)로 바꾸는 모듈
 *
 * 육임은 "질문이 생긴 그 순간"을 좌표로 쓰기 때문에
 * 날짜(일진)뿐 아니라 시각(점시), 절기(월지)까지 정확해야 한다.
 *
 * 이 모듈이 계산하는 것
 *  1) 일주(日柱) 간지 — 자시(23시) 이후는 다음 날로 넘긴다
 *  2) 점시(占時) 지지 — 두 시간 단위 12지지
 *  3) 태양 황경(黃經) — 절기를 계산하는 천문 값
 *  4) 월지(月支) — 절기(節) 기준 달의 지지
 *  5) 공망(空亡) — 일진이 속한 순(旬)에서 빠진 두 지지
 */
import type { Stem, Branch } from '../types'
import { BRANCHES, STEMS, branchIndex, stemIndex } from './elements'

const MS_PER_DAY = 86_400_000

/** 0 이상 360 미만으로 각도를 정리 */
function normalizeDegree(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function toRadian(deg: number): number {
  return (deg * Math.PI) / 180
}

// ── 일주(日柱) ─────────────────────────────────────────────

/**
 * 육임에서 하루의 시작은 자시(子時, 23:00)이다.
 * 그래서 23:00~23:59는 이미 "다음 날"로 센다.
 *
 * @returns 일진 계산에 사용할 날짜(연·월·일만 의미 있음)
 */
export function getOracleDay(date: Date): Date {
  const shifted = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (date.getHours() >= 23) shifted.setDate(shifted.getDate() + 1)
  return shifted
}

/**
 * 일주(日柱) 간지를 계산한다.
 * 기준점: 1900-01-01 = 갑술일(甲戌) → 천간 0번, 지지 10번
 * (교차 검증: 2000-01-01 → 무오일(戊午))
 */
export function getDayStemBranch(date: Date): { stem: Stem; branch: Branch } {
  const day = getOracleDay(date)
  const base = Date.UTC(1900, 0, 1)
  const target = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())
  const diffDays = Math.round((target - base) / MS_PER_DAY)

  const stemIdx = ((diffDays % 10) + 10) % 10
  const branchIdx = (((diffDays + 10) % 12) + 12) % 12

  return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] }
}

// ── 점시(占時) ─────────────────────────────────────────────

/**
 * 점시(占時) 지지를 계산한다.
 * 子 23:00~00:59, 丑 01:00~02:59, … 亥 21:00~22:59
 */
export function getHourBranch(date: Date): Branch {
  const idx = Math.floor(((date.getHours() + 1) % 24) / 2)
  return BRANCHES[idx]
}

/**
 * 낮(晝)인지 밤(夜)인지 판정한다.
 * 육임은 묘시(卯, 05:00)부터 신시(申, ~17:00)까지를 낮으로 본다.
 */
export function isDaytime(date: Date): boolean {
  const hour = date.getHours()
  return hour >= 5 && hour < 17
}

// ── 절기(節氣) ─────────────────────────────────────────────

/** 그레고리력 → 율리우스일(JD) */
export function toJulianDay(date: Date): number {
  return date.getTime() / MS_PER_DAY + 2_440_587.5
}

/**
 * 태양 겉보기 황경(黃經)을 도(°) 단위로 계산한다.
 * Meeus 『Astronomical Algorithms』 27장 저정밀 공식(오차 약 0.01°).
 *
 * 황경 0° = 춘분, 90° = 하지, 180° = 추분, 270° = 동지.
 * 절기는 황경이 15° 경계를 지나는 순간이므로,
 * 고정된 날짜 표를 쓰지 않고도 어떤 연도든 절기를 정확히 판정할 수 있다.
 */
export function getSolarLongitude(date: Date): number {
  const T = (toJulianDay(date) - 2_451_545.0) / 36_525

  // 태양의 기하 평균 황경
  const L0 = 280.466_46 + 36_000.769_83 * T + 0.000_303_2 * T * T
  // 태양의 평균 근점 이각
  const M = 357.529_11 + 35_999.050_29 * T - 0.000_153_7 * T * T
  const Mr = toRadian(normalizeDegree(M))

  // 중심차(中心差)
  const C =
    (1.914_602 - 0.004_817 * T - 0.000_014 * T * T) * Math.sin(Mr) +
    (0.019_993 - 0.000_101 * T) * Math.sin(2 * Mr) +
    0.000_289 * Math.sin(3 * Mr)

  const trueLongitude = L0 + C

  // 광행차·황경 보정 → 겉보기 황경
  const omega = toRadian(125.04 - 1_934.136 * T)
  const apparent = trueLongitude - 0.005_69 - 0.004_78 * Math.sin(omega)

  return normalizeDegree(apparent)
}

/**
 * 월지(月支)를 계산한다.
 * 절(節) 기준: 입춘(황경 315°)부터 인월(寅月)이 시작된다.
 */
export function getMonthBranch(date: Date): Branch {
  const step = Math.floor(normalizeDegree(getSolarLongitude(date) - 315) / 30)
  return BRANCHES[(2 + step) % 12]   // 2 = 寅
}

// ── 공망(空亡) ─────────────────────────────────────────────

/**
 * 공망(空亡)을 계산한다.
 * 60갑자를 열 개씩 묶은 순(旬)에서 짝을 못 만난 두 지지다.
 * 예) 갑자순(甲子~癸酉) → 戌·亥가 공망
 *
 * 육임에서 공망에 걸린 지지는 "힘이 비어 있다 = 결과가 잘 맺히지 않는다"로 읽는다.
 */
export function getVoidBranches(dayStem: Stem, dayBranch: Branch): Branch[] {
  const start = (((branchIndex(dayBranch) - stemIndex(dayStem) + 10) % 12) + 12) % 12
  return [BRANCHES[start], BRANCHES[(start + 1) % 12]]
}

// ── 표기 유틸 ──────────────────────────────────────────────

const BRANCH_HANJA_MAP: Record<Branch, string> = {
  zi: '子', chou: '丑', yin: '寅', mao: '卯', chen: '辰', si: '巳',
  wu: '午', wei: '未', shen: '申', you: '酉', xu: '戌', hai: '亥'
}

const STEM_HANJA_MAP: Record<Stem, string> = {
  jia: '甲', yi: '乙', bing: '丙', ding: '丁', wu: '戊',
  ji: '己', geng: '庚', xin: '辛', ren: '壬', gui: '癸'
}

const BRANCH_KOREAN_MAP: Record<Branch, string> = {
  zi: '자', chou: '축', yin: '인', mao: '묘', chen: '진', si: '사',
  wu: '오', wei: '미', shen: '신', you: '유', xu: '술', hai: '해'
}

const STEM_KOREAN_MAP: Record<Stem, string> = {
  jia: '갑', yi: '을', bing: '병', ding: '정', wu: '무',
  ji: '기', geng: '경', xin: '신', ren: '임', gui: '계'
}

/** 지지 한자 표기 */
export function branchToHanja(branch: Branch): string {
  return BRANCH_HANJA_MAP[branch]
}

/** 천간 한자 표기 */
export function stemToHanja(stem: Stem): string {
  return STEM_HANJA_MAP[stem]
}

/** 지지 한글 독음 */
export function branchToKorean(branch: Branch): string {
  return BRANCH_KOREAN_MAP[branch]
}

/** 천간 한글 독음 */
export function stemToKorean(stem: Stem): string {
  return STEM_KOREAN_MAP[stem]
}

export { STEMS, BRANCHES, branchIndex, stemIndex }
