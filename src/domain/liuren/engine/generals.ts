/**
 * generals.ts — 12천장(天將) 배속 모듈
 *
 * 천장은 천반 위에 얹히는 "역할 카드" 12장이다.
 * 귀인(貴人)이 어느 칸에 앉느냐에 따라 나머지 11장의 자리가 정해진다.
 *
 * 규칙 두 가지
 *  1) 귀인 자리는 일간 + 낮/밤에 따라 정해진다 (주귀·야귀)
 *     가결: 甲戊庚은 소·양, 乙己는 쥐·원숭이, 丙丁은 돼지·닭,
 *           壬癸는 토끼·뱀, 辛은 말·범
 *  2) 귀인이 앉은 **지반** 칸이 亥子丑寅卯辰이면 순행(시계 방향),
 *     巳午未申酉戌이면 역행(반시계 방향)으로 나머지를 깔아 나간다.
 */
import type { Branch, Stem, HeavenlyGeneral } from '../types'
import { BRANCHES, branchIndex } from './elements'
import { findEarthForHeaven } from './heavenPlate'
import { isDaytime } from './calendar'

/** 천장 순서 (귀인부터) */
const GENERAL_ORDER: HeavenlyGeneral[] = [
  '귀인', '등사', '주작', '육합', '구진', '청룡',
  '천공', '백호', '태상', '현무', '태음', '천후'
]

/** 주귀인(晝貴人) — 낮(묘시~신시)에 쓰는 귀인 자리 */
const NOBLE_DAY: Record<Stem, Branch> = {
  jia: 'chou',   // 甲 → 丑
  wu: 'chou',    // 戊 → 丑
  geng: 'chou',  // 庚 → 丑
  yi: 'zi',      // 乙 → 子
  ji: 'zi',      // 己 → 子
  bing: 'hai',   // 丙 → 亥
  ding: 'hai',   // 丁 → 亥
  ren: 'mao',    // 壬 → 卯
  gui: 'mao',    // 癸 → 卯
  xin: 'wu'      // 辛 → 午
}

/** 야귀인(夜貴人) — 밤(유시~인시)에 쓰는 귀인 자리 */
const NOBLE_NIGHT: Record<Stem, Branch> = {
  jia: 'wei',    // 甲 → 未
  wu: 'wei',     // 戊 → 未
  geng: 'wei',   // 庚 → 未
  yi: 'shen',    // 乙 → 申
  ji: 'shen',    // 己 → 申
  bing: 'you',   // 丙 → 酉
  ding: 'you',   // 丁 → 酉
  ren: 'si',     // 壬 → 巳
  gui: 'si',     // 癸 → 巳
  xin: 'yin'     // 辛 → 寅
}

/** 귀인이 순행으로 깔리는 지반 구간: 亥子丑寅卯辰 */
const FORWARD_ZONE = new Set<Branch>(['hai', 'zi', 'chou', 'yin', 'mao', 'chen'])

/** 일간·주야에 따른 귀인 지지를 반환한다. */
export function getNobleBranch(dayStem: Stem, isDay: boolean): Branch {
  return isDay ? NOBLE_DAY[dayStem] : NOBLE_NIGHT[dayStem]
}

/**
 * 12천장 배속 맵을 만든다.
 *
 * @returns 천반 지지 → 그 위에 앉은 천장
 */
export function buildGeneralMap(
  dayStem: Stem,
  isDay: boolean,
  heavenPlate: Record<Branch, Branch>
): Record<Branch, HeavenlyGeneral> {
  const nobleBranch = getNobleBranch(dayStem, isDay)

  // 귀인(천반 신)이 앉아 있는 지반 칸을 찾는다
  const nobleSeat = findEarthForHeaven(heavenPlate, nobleBranch)
  const direction = FORWARD_ZONE.has(nobleSeat) ? 1 : -1
  const seatIdx = branchIndex(nobleSeat)

  const result = {} as Record<Branch, HeavenlyGeneral>

  for (let i = 0; i < 12; i++) {
    const earth = BRANCHES[(((seatIdx + direction * i) % 12) + 12) % 12]
    // 천장은 그 칸에 올라온 "천반 지지"에 붙는다
    result[heavenPlate[earth]] = GENERAL_ORDER[i]
  }

  return result
}

/** 천장이 순행으로 깔렸는지(true) 역행인지(false) */
export function isGeneralForward(
  dayStem: Stem,
  isDay: boolean,
  heavenPlate: Record<Branch, Branch>
): boolean {
  return FORWARD_ZONE.has(findEarthForHeaven(heavenPlate, getNobleBranch(dayStem, isDay)))
}

export { isDaytime }
