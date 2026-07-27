/**
 * elements.ts — 오행(五行)·간지(干支) 공용 상수 및 판정 함수
 *
 * 여러 엔진 모듈이 각자 오행 표를 중복 정의하면서 값이 어긋나는 문제가 있었다.
 * 이 파일이 "단 하나의 기준표"가 되며, 다른 엔진 모듈은 여기서만 가져다 쓴다.
 */
import type { Branch, Stem, Element, Relation, Strength } from '../types'

// ── 기본 순서 배열 ─────────────────────────────────────────
/** 천간 순서 (갑→계) */
export const STEMS: Stem[] = [
  'jia', 'yi', 'bing', 'ding', 'wu', 'ji', 'geng', 'xin', 'ren', 'gui'
]

/** 지지 순서 (자→해) */
export const BRANCHES: Branch[] = [
  'zi', 'chou', 'yin', 'mao', 'chen', 'si', 'wu', 'wei', 'shen', 'you', 'xu', 'hai'
]

/** 지지 → 순서 번호 (자=0 … 해=11) */
export function branchIndex(branch: Branch): number {
  return BRANCHES.indexOf(branch)
}

/** 천간 → 순서 번호 (갑=0 … 계=9) */
export function stemIndex(stem: Stem): number {
  return STEMS.indexOf(stem)
}

/** 지지를 n칸 이동 (양수=순행, 음수=역행) */
export function shiftBranch(branch: Branch, step: number): Branch {
  return BRANCHES[(((branchIndex(branch) + step) % 12) + 12) % 12]
}

// ── 오행 배속 ──────────────────────────────────────────────
/** 지지의 오행 */
export const BRANCH_ELEMENT: Record<Branch, Element> = {
  zi: '수', chou: '토', yin: '목', mao: '목', chen: '토', si: '화',
  wu: '화', wei: '토', shen: '금', you: '금', xu: '토', hai: '수'
}

/** 천간의 오행 */
export const STEM_ELEMENT: Record<Stem, Element> = {
  jia: '목', yi: '목', bing: '화', ding: '화', wu: '토',
  ji: '토', geng: '금', xin: '금', ren: '수', gui: '수'
}

/** 오행 상극(相剋): 키가 값을 극한다 */
const OVERCOME: Record<Element, Element> = {
  목: '토', 토: '수', 수: '화', 화: '금', 금: '목'
}

/** 오행 상생(相生): 키가 값을 낳는다 */
const GENERATE: Record<Element, Element> = {
  목: '화', 화: '토', 토: '금', 금: '수', 수: '목'
}

/** a가 b를 극하는가 */
export function elementOvercomes(a: Element, b: Element): boolean {
  return OVERCOME[a] === b
}

/** a가 b를 낳는가(생하는가) */
export function elementGenerates(a: Element, b: Element): boolean {
  return GENERATE[a] === b
}

// ── 음양 ──────────────────────────────────────────────────
/** 양지(陽支): 子寅辰午申戌 */
const YANG_BRANCH_SET = new Set<Branch>(['zi', 'yin', 'chen', 'wu', 'shen', 'xu'])

/** 양간(陽干): 甲丙戊庚壬 */
const YANG_STEM_SET = new Set<Stem>(['jia', 'bing', 'wu', 'geng', 'ren'])

/** 지지가 양(陽)인가 */
export function isYangBranch(branch: Branch): boolean {
  return YANG_BRANCH_SET.has(branch)
}

/** 천간이 양(陽)인가 */
export function isYangStem(stem: Stem): boolean {
  return YANG_STEM_SET.has(stem)
}

// ── 기궁(寄宮) ─────────────────────────────────────────────
/**
 * 천간 기궁 — 천간이 지반에서 머무는 자리.
 * 甲寅 乙辰 丙巳 丁未 戊巳 己未 庚申 辛戌 壬亥 癸丑
 */
export const STEM_PALACE: Record<Stem, Branch> = {
  jia: 'yin', yi: 'chen', bing: 'si', ding: 'wei', wu: 'si',
  ji: 'wei', geng: 'shen', xin: 'xu', ren: 'hai', gui: 'chou'
}

/** 천간 오합(五合) — 甲己 乙庚 丙辛 丁壬 戊癸 */
export const STEM_COMBINE: Record<Stem, Stem> = {
  jia: 'ji', ji: 'jia',
  yi: 'geng', geng: 'yi',
  bing: 'xin', xin: 'bing',
  ding: 'ren', ren: 'ding',
  wu: 'gui', gui: 'wu'
}

// ── 지지 관계 ──────────────────────────────────────────────
/** 충(沖) — 여섯 칸 건너 마주 보는 지지 */
export function clashBranch(branch: Branch): Branch {
  return shiftBranch(branch, 6)
}

/**
 * 형(刑) — 寅巳申 / 丑戌未 / 子卯 / 辰午酉亥(자형)
 * "다음 형 대상"을 돌려준다.
 */
export const PUNISH_BRANCH: Record<Branch, Branch> = {
  yin: 'si', si: 'shen', shen: 'yin',
  chou: 'xu', xu: 'wei', wei: 'chou',
  zi: 'mao', mao: 'zi',
  chen: 'chen', wu: 'wu', you: 'you', hai: 'hai'
}

/** 자형(自刑) 지지: 辰午酉亥 */
export function isSelfPunish(branch: Branch): boolean {
  return PUNISH_BRANCH[branch] === branch
}

/** 육합(六合) — 子丑 寅亥 卯戌 辰酉 巳申 午未 */
export const SIX_HARMONY: Record<Branch, Branch> = {
  zi: 'chou', chou: 'zi',
  yin: 'hai', hai: 'yin',
  mao: 'xu', xu: 'mao',
  chen: 'you', you: 'chen',
  si: 'shen', shen: 'si',
  wu: 'wei', wei: 'wu'
}

/** 삼합(三合) 다음 자리 — 生→旺→庫 순서에서 한 칸 앞으로 */
export const TRIAD_NEXT: Record<Branch, Branch> = {
  shen: 'zi', zi: 'chen', chen: 'shen',
  hai: 'mao', mao: 'wei', wei: 'hai',
  yin: 'wu', wu: 'xu', xu: 'yin',
  si: 'you', you: 'chou', chou: 'si'
}

/** 삼합(三合) 이전 자리 — 生→旺→庫 순서에서 한 칸 뒤로 */
export const TRIAD_PREV: Record<Branch, Branch> = {
  zi: 'shen', chen: 'zi', shen: 'chen',
  mao: 'hai', wei: 'mao', hai: 'wei',
  wu: 'yin', xu: 'wu', yin: 'xu',
  you: 'si', chou: 'you', si: 'chou'
}

/** 역마(驛馬) — 申子辰→寅, 寅午戌→申, 巳酉丑→亥, 亥卯未→巳 */
export function postHorse(branch: Branch): Branch {
  switch (branch) {
    case 'shen': case 'zi': case 'chen': return 'yin'
    case 'yin': case 'wu': case 'xu': return 'shen'
    case 'si': case 'you': case 'chou': return 'hai'
    default: return 'si'   // 亥卯未
  }
}

/** 사맹(四孟) 寅申巳亥 */
const MENG = new Set<Branch>(['yin', 'shen', 'si', 'hai'])
/** 사중(四仲) 子午卯酉 */
const ZHONG = new Set<Branch>(['zi', 'wu', 'mao', 'you'])

/** 지지의 맹·중·계(孟仲季) 구분 */
export function branchTier(branch: Branch): '맹' | '중' | '계' {
  if (MENG.has(branch)) return '맹'
  if (ZHONG.has(branch)) return '중'
  return '계'
}

// ── 왕상휴수사(旺相休囚死) ──────────────────────────────────
/**
 * 월지(月支)의 오행을 기준으로 어떤 지지가 얼마나 힘이 있는지 판정한다.
 *
 * - 왕(旺): 월지와 같은 오행 → 제철을 맞은 힘
 * - 상(相): 월지가 낳아 주는 오행 → 뒤를 받쳐 주는 힘
 * - 휴(休): 월지를 낳아 준 오행 → 할 일을 마친 힘
 * - 수(囚): 월지를 극하는 오행 → 갇힌 힘
 * - 사(死): 월지가 극하는 오행 → 꺾인 힘
 */
export function branchStrength(branch: Branch, monthBranch: Branch): Strength {
  const target = BRANCH_ELEMENT[branch]
  const season = BRANCH_ELEMENT[monthBranch]

  if (target === season) return '왕'
  if (elementGenerates(season, target)) return '상'
  if (elementGenerates(target, season)) return '휴'
  if (elementOvercomes(target, season)) return '수'
  return '사'
}

// ── 일간 기준 관계(육친 축약) ──────────────────────────────
/**
 * 일간(日干)을 "나"로 보고 지지가 어떤 역할인지 판정한다.
 *
 * - 비겁: 나와 같은 편 / 경쟁자
 * - 식상: 내가 내보내는 힘 (표현·활동)
 * - 재성: 내가 다루는 대상 (돈·성과)
 * - 관귀: 나를 누르는 힘 (일·압박·규칙)
 * - 인수: 나를 도와주는 힘 (도움·문서·배움)
 */
export function relationToDayStem(branch: Branch, dayStem: Stem): Relation {
  const me = STEM_ELEMENT[dayStem]
  const other = BRANCH_ELEMENT[branch]

  if (me === other) return '비겁'
  if (elementGenerates(me, other)) return '식상'
  if (elementOvercomes(me, other)) return '재성'
  if (elementOvercomes(other, me)) return '관귀'
  return '인수'
}
