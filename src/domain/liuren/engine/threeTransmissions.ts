/**
 * threeTransmissions.ts — 삼전(三傳) 추출 모듈 · 구종법(九宗法)
 *
 * 삼전은 "일이 어떻게 시작해서(초전) 어떤 고비를 지나(중전) 어디로 끝나는지(말전)"를
 * 세 개의 지지로 보여 주는 육임의 뼈대다.
 *
 * 초전을 정하는 규칙은 아홉 가지이며, 반드시 아래 순서로 판정한다.
 *
 *   ① 복음법(伏吟)  — 천반과 지반이 완전히 겹칠 때 (형刑으로 푼다)
 *   ② 반음법(返吟)  — 천반이 지반과 정반대일 때
 *   ③ 적극법(賊剋)  — 극이 딱 하나: 하적상 우선(중심과) → 상극하(원수과)
 *   ④ 비용법(比用)  — 극이 여럿: 일간과 음양이 같은 것을 고른다
 *   ⑤ 섭해법(涉害)  — 비용으로도 못 정하면 지나온 길의 극 개수를 센다
 *   ⑥ 요극법(遙剋)  — 극이 하나도 없을 때, 일간과 상신의 원격 극을 본다
 *   ⑦ 묘성법(昴星)  — 요극도 없을 때, 유(酉)를 기준점으로 삼는다
 *   ⑧ 별책법(別責)  — 사과가 3과뿐일 때
 *   ⑨ 팔전법(八專)  — 일간 기궁과 일지가 같은 칸일 때
 *
 * 중전·말전은 특수과가 아니면 발전법(發傳法)으로 잇는다.
 *   다음 전 = heavenPlate[현재 전]
 *
 * 참고: 大六壬指南, 六壬大全, 六壬課經
 */
import type { Branch, Stem, FourCourse } from '../types'
import {
  BRANCHES, branchIndex, shiftBranch,
  BRANCH_ELEMENT, STEM_ELEMENT, elementOvercomes,
  isYangStem, isYangBranch, branchTier,
  STEM_PALACE, STEM_COMBINE, TRIAD_PREV,
  PUNISH_BRANCH, isSelfPunish, clashBranch, postHorse
} from './elements'
import { findEarthForHeaven, isFuyin, isFanyin } from './heavenPlate'
import {
  getUpperOvercoming, getLowerOvercoming, countDistinctCourses, isEightSpecialized
} from './fourCourses'

/** 삼전 계산 결과 */
export interface CourseStructure {
  /** 초전·중전·말전 지지 */
  branches: [Branch, Branch, Branch]
  /** 과체(課體) 이름 — courses.json 키와 일치 */
  courseName: string
  /** 초전을 정한 방법 이름 */
  methodName: string
  /** 부가로 붙는 격(格) 이름들 */
  patternNames: string[]
}

// ── 내부 유틸 ────────────────────────────────────────────────

/** 발전법(發傳法): 지반의 그 자리 위에 올라온 천반이 다음 전이 된다 */
function nextByPlate(current: Branch, heavenPlate: Record<Branch, Branch>): Branch {
  return heavenPlate[current]
}

/** 초전만 정하면 중·말전은 발전법으로 잇는다 */
function chainFromInitial(
  initial: Branch,
  heavenPlate: Record<Branch, Branch>
): [Branch, Branch, Branch] {
  const middle = nextByPlate(initial, heavenPlate)
  return [initial, middle, nextByPlate(middle, heavenPlate)]
}

// ── ⑤ 섭해법(涉害法) ────────────────────────────────────────

/**
 * 섭해 깊이(涉害深淺)를 잰다.
 *
 * 천반 지지는 원래 자기 자리(지반의 같은 이름 칸)에서 지금 자리까지 걸어온 셈이다.
 * 그 길에서 자기를 극(剋)하는 지반 칸을 몇 번 밟았는지 센다.
 * 많이 밟았을수록 "험한 길을 뚫고 온 기운"이라 초전이 될 자격이 크다.
 */
function measureHarmDepth(course: FourCourse): number {
  const homeIdx = branchIndex(course.heaven)
  const seatIdx = branchIndex(course.earth)
  const steps = (seatIdx - homeIdx + 12) % 12
  const myElement = BRANCH_ELEMENT[course.heaven]

  let depth = 0
  for (let k = 1; k <= steps; k++) {
    const passed = BRANCHES[(homeIdx + k) % 12]
    if (elementOvercomes(BRANCH_ELEMENT[passed], myElement)) depth++
  }
  return depth
}

/**
 * 섭해법으로 초전을 정한다.
 * 깊이가 같으면 사맹(寅申巳亥) → 사중(子午卯酉) 순으로 우선하고,
 * 그래도 같으면 양일은 간상신, 음일은 지상신을 쓴다.
 */
function applySeophae(
  candidates: FourCourse[],
  dayStem: Stem,
  ganUp: Branch,
  zhiUp: Branch
): { initial: Branch; pattern?: string } {
  const scored = candidates.map(c => ({ course: c, depth: measureHarmDepth(c) }))
  const maxDepth = Math.max(...scored.map(s => s.depth))
  const deepest = scored.filter(s => s.depth === maxDepth).map(s => s.course)

  if (deepest.length === 1) return { initial: deepest[0].heaven }

  // 사맹 우선 — 견기격(見機格)
  const meng = deepest.filter(c => branchTier(c.earth) === '맹')
  if (meng.length === 1) return { initial: meng[0].heaven, pattern: '견기격' }
  if (meng.length > 1) return { initial: meng[0].heaven, pattern: '견기격' }

  // 사중 우선 — 찰미격(察微格)
  const zhong = deepest.filter(c => branchTier(c.earth) === '중')
  if (zhong.length >= 1) return { initial: zhong[0].heaven, pattern: '찰미격' }

  // 끝내 같으면 — 철하격(綴瑕格)
  return { initial: isYangStem(dayStem) ? ganUp : zhiUp, pattern: '철하격' }
}

// ── ③④⑤ 극(剋)이 있을 때의 초전 결정 ────────────────────────

function resolveByOvercoming(
  courses: FourCourse[],
  dayStem: Stem,
  ganUp: Branch,
  zhiUp: Branch
): { initial: Branch; courseName: string; methodName: string; patternNames: string[] } | null {
  const lower = getLowerOvercoming(courses)   // 하적상(下賊上)
  const upper = getUpperOvercoming(courses)   // 상극하(上剋下)

  // ③ 적극법 — 극이 딱 하나뿐인 경우
  if (lower.length === 1) {
    return {
      initial: lower[0].heaven,
      courseName: '중심과', methodName: '적극법(賊剋法)', patternNames: []
    }
  }
  if (lower.length === 0 && upper.length === 1) {
    return {
      initial: upper[0].heaven,
      courseName: '원수과', methodName: '적극법(賊剋法)', patternNames: []
    }
  }

  // 극이 여러 개 — 하적상이 있으면 하적상끼리, 없으면 상극하끼리 비교한다
  const candidates = lower.length >= 2 ? lower : upper.length >= 2 ? upper : []
  if (candidates.length === 0) return null   // 극이 전혀 없음

  // ④ 비용법 — 일간과 음양이 같은 상신을 고른다
  const sameYinYang = candidates.filter(
    c => isYangBranch(c.heaven) === isYangStem(dayStem)
  )
  if (sameYinYang.length === 1) {
    return {
      initial: sameYinYang[0].heaven,
      courseName: '비용과', methodName: '비용법(比用法)', patternNames: []
    }
  }

  // ⑤ 섭해법 — 모두 같은 편이거나 모두 다른 편이면 길의 험함을 잰다
  const pool = sameYinYang.length > 1 ? sameYinYang : candidates
  const { initial, pattern } = applySeophae(pool, dayStem, ganUp, zhiUp)
  return {
    initial,
    courseName: '섭해과', methodName: '섭해법(涉害法)',
    patternNames: pattern ? [pattern] : []
  }
}

// ── ⑥ 요극법(遙剋法) ────────────────────────────────────────

function applyYogeuk(
  courses: FourCourse[],
  dayStem: Stem
): { initial: Branch; patternNames: string[] } | null {
  const me = STEM_ELEMENT[dayStem]

  // 호시격(蒿矢格): 상신이 일간을 극한다 — 밖에서 날아오는 화살
  const attackers = courses.filter(c => elementOvercomes(BRANCH_ELEMENT[c.heaven], me))
  // 탄사격(彈射格): 일간이 상신을 극한다 — 내가 멀리 쏘는 구슬
  const targets = courses.filter(c => elementOvercomes(me, BRANCH_ELEMENT[c.heaven]))

  const pick = (list: FourCourse[]): Branch => {
    if (list.length === 1) return list[0].heaven
    const same = list.filter(c => isYangBranch(c.heaven) === isYangStem(dayStem))
    return (same.length > 0 ? same : list)[0].heaven
  }

  if (attackers.length > 0) return { initial: pick(attackers), patternNames: ['호시격'] }
  if (targets.length > 0) return { initial: pick(targets), patternNames: ['탄사격'] }
  return null
}

// ── ⑦ 묘성법(昴星法) ────────────────────────────────────────

function applyMyoseong(
  dayStem: Stem,
  heavenPlate: Record<Branch, Branch>,
  ganUp: Branch,
  zhiUp: Branch
): { branches: [Branch, Branch, Branch]; patternNames: string[] } {
  if (isYangStem(dayStem)) {
    // 호시전봉격(虎視轉蓬格): 지반 유(酉) 위의 천반이 초전
    return { branches: [heavenPlate['you'], zhiUp, ganUp], patternNames: ['호시전봉격'] }
  }
  // 동사엄목격(冬蛇掩目格): 천반 유(酉)가 앉은 지반이 초전
  return {
    branches: [findEarthForHeaven(heavenPlate, 'you'), ganUp, zhiUp],
    patternNames: ['동사엄목격']
  }
}

// ── ⑧ 별책법(別責法) ────────────────────────────────────────

function applyByeolchaek(
  dayStem: Stem,
  dayBranch: Branch,
  heavenPlate: Record<Branch, Branch>,
  ganUp: Branch
): [Branch, Branch, Branch] {
  const initial = isYangStem(dayStem)
    // 양일: 일간과 합(合)하는 천간의 기궁 위 천반
    ? heavenPlate[STEM_PALACE[STEM_COMBINE[dayStem]]]
    // 음일: 일지 삼합의 앞자리
    : TRIAD_PREV[dayBranch]

  return [initial, ganUp, ganUp]
}

// ── ⑨ 팔전법(八專法) ────────────────────────────────────────

function applyPaljeon(
  dayStem: Stem,
  courses: FourCourse[],
  ganUp: Branch
): { branches: [Branch, Branch, Branch]; patternNames: string[] } {
  if (isYangStem(dayStem)) {
    // 양일: 간상신에서 순행으로 세 번째
    return { branches: [shiftBranch(ganUp, 2), ganUp, ganUp], patternNames: ['유박불수격'] }
  }
  // 음일: 4과 상신에서 역행으로 세 번째
  return { branches: [shiftBranch(courses[3].heaven, -2), ganUp, ganUp], patternNames: ['독족격'] }
}

// ── ① 복음법(伏吟法) ────────────────────────────────────────

function applyBokeum(
  dayStem: Stem,
  ganUp: Branch,
  zhiUp: Branch
): { branches: [Branch, Branch, Branch]; patternNames: string[] } {
  const yang = isYangStem(dayStem)
  const initial = yang ? ganUp : zhiUp
  const alternate = yang ? zhiUp : ganUp

  // 초전이 자형(辰午酉亥)이면 상대 자리를 중전으로 삼는다
  const middle = isSelfPunish(initial) ? alternate : PUNISH_BRANCH[initial]
  // 중전도 자형이면 말전은 충(沖)으로 푼다
  const final = isSelfPunish(middle) ? clashBranch(middle) : PUNISH_BRANCH[middle]

  return {
    branches: [initial, middle, final],
    patternNames: [yang ? '자임격' : '자신격']
  }
}

// ── ② 반음법(返吟法) ────────────────────────────────────────

function applyBaneum(
  dayBranch: Branch,
  ganUp: Branch,
  zhiUp: Branch
): { branches: [Branch, Branch, Branch]; patternNames: string[] } {
  // 극이 없는 반음 — 정란사격(井欄射格): 역마가 초전이 된다
  return {
    branches: [postHorse(dayBranch), zhiUp, ganUp],
    patternNames: ['정란사격']
  }
}

// ── 삼전 구조에서 읽는 부가 격 ──────────────────────────────

function detectFlowPatterns(branches: [Branch, Branch, Branch]): string[] {
  const [a, b, c] = branches.map(branchIndex)
  if ((b - a + 12) % 12 === 1 && (c - b + 12) % 12 === 1) return ['연여과']
  if ((a - b + 12) % 12 === 1 && (b - c + 12) % 12 === 1) return ['퇴연주격']
  return []
}

// ── 공개 API ─────────────────────────────────────────────────

/**
 * 구종법(九宗法)에 따라 삼전과 과체(課體)를 결정한다.
 */
export function buildCourseStructure(
  dayStem: Stem,
  dayBranch: Branch,
  heavenPlate: Record<Branch, Branch>,
  fourCourses: FourCourse[]
): CourseStructure {
  const ganUp = fourCourses[0].heaven   // 간상신(干上神)
  const zhiUp = fourCourses[2].heaven   // 지상신(支上神)

  const finish = (
    branches: [Branch, Branch, Branch],
    courseName: string,
    methodName: string,
    patternNames: string[]
  ): CourseStructure => ({
    branches,
    courseName,
    methodName,
    patternNames: [...new Set([...patternNames, ...detectFlowPatterns(branches)])]
  })

  // ① 복음과 — 월장과 점시가 같아 천지반이 겹친 상태
  if (isFuyin(heavenPlate)) {
    const { branches, patternNames } = applyBokeum(dayStem, ganUp, zhiUp)
    const extra = isEightSpecialized(dayStem, dayBranch) ? ['두전격'] : []
    return finish(branches, '복음과', '복음법(伏吟法)', [...patternNames, ...extra])
  }

  // ② 반음과 — 월장과 점시가 충(沖)이라 천지반이 정반대인 상태
  if (isFanyin(heavenPlate)) {
    const resolved = resolveByOvercoming(fourCourses, dayStem, ganUp, zhiUp)
    if (resolved) {
      return finish(
        chainFromInitial(resolved.initial, heavenPlate),
        '반음과', '반음법(返吟法)', resolved.patternNames
      )
    }
    const { branches, patternNames } = applyBaneum(dayBranch, ganUp, zhiUp)
    return finish(branches, '반음과', '반음법(返吟法)', patternNames)
  }

  // ③④⑤ 극이 있는 경우
  const resolved = resolveByOvercoming(fourCourses, dayStem, ganUp, zhiUp)
  if (resolved) {
    return finish(
      chainFromInitial(resolved.initial, heavenPlate),
      resolved.courseName, resolved.methodName, resolved.patternNames
    )
  }

  // ⑨ 팔전과 — 일간 기궁과 일지가 같은 칸이라 사과가 두 개로 줄어든 날
  if (isEightSpecialized(dayStem, dayBranch)) {
    const { branches, patternNames } = applyPaljeon(dayStem, fourCourses, ganUp)
    return finish(branches, '팔전과', '팔전법(八專法)', patternNames)
  }

  // ⑧ 별책과 — 겹치는 과가 있어 사과가 온전히 넷이 되지 않을 때
  if (countDistinctCourses(fourCourses) < 4) {
    return finish(
      applyByeolchaek(dayStem, dayBranch, heavenPlate, ganUp),
      '별책과', '별책법(別責法)', ['무음격']
    )
  }

  // ⑥ 요극과 — 사과는 온전한데 극이 하나도 없을 때
  const yogeuk = applyYogeuk(fourCourses, dayStem)
  if (yogeuk) {
    return finish(
      chainFromInitial(yogeuk.initial, heavenPlate),
      '요극과', '요극법(遙剋法)', yogeuk.patternNames
    )
  }

  // ⑦ 묘성과 — 요극조차 없을 때의 마지막 규칙
  const myoseong = applyMyoseong(dayStem, heavenPlate, ganUp, zhiUp)
  return finish(myoseong.branches, '묘성과', '묘성법(昴星法)', myoseong.patternNames)
}
