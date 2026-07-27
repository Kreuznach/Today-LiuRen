/**
 * fourCourses.ts — 사과(四課) 도출 모듈
 *
 * 사과는 "나(일간)"와 "내 자리(일지)"가 지금 어떤 기운을 이고 있는지 보여주는 4개의 짝이다.
 *
 * 1과: 일간의 기궁(寄宮) 위에 올라온 천반          → 나 자신
 * 2과: 1과 천반을 지반으로 보고 그 위의 천반        → 나를 둘러싼 상황
 * 3과: 일지(日支) 위에 올라온 천반                  → 상대 / 일의 터전
 * 4과: 3과 천반을 지반으로 보고 그 위의 천반        → 상대를 둘러싼 상황
 */
import type { Branch, Stem, FourCourse } from '../types'
import {
  BRANCHES, branchIndex, BRANCH_ELEMENT, elementOvercomes, STEM_PALACE
} from './elements'

export { STEM_PALACE }

/**
 * 사과(四課)를 도출합니다.
 */
export function buildFourCourses(
  dayStem: Stem,
  dayBranch: Branch,
  heavenPlate: Record<Branch, Branch>
): FourCourse[] {
  const course1Earth = STEM_PALACE[dayStem]
  const course1Heaven = heavenPlate[course1Earth]

  const course2Earth = course1Heaven
  const course2Heaven = heavenPlate[course2Earth]

  const course3Earth = dayBranch
  const course3Heaven = heavenPlate[course3Earth]

  const course4Earth = course3Heaven
  const course4Heaven = heavenPlate[course4Earth]

  return [
    { index: 1, heaven: course1Heaven, earth: course1Earth },
    { index: 2, heaven: course2Heaven, earth: course2Earth },
    { index: 3, heaven: course3Heaven, earth: course3Earth },
    { index: 4, heaven: course4Heaven, earth: course4Earth },
  ]
}

/**
 * 상극하(上剋下) — 위(천반)가 아래(지반)를 극하는가
 */
export function doesHeavenOvercomeEarth(heaven: Branch, earth: Branch): boolean {
  return elementOvercomes(BRANCH_ELEMENT[heaven], BRANCH_ELEMENT[earth])
}

/**
 * 하적상(下賊上) — 아래(지반)가 위(천반)를 극하는가
 */
export function doesEarthOvercomeHeaven(heaven: Branch, earth: Branch): boolean {
  return elementOvercomes(BRANCH_ELEMENT[earth], BRANCH_ELEMENT[heaven])
}

/** 사과 중 극(剋)이 있는 과를 모두 반환 */
export function getOvercomingCourses(courses: FourCourse[]): FourCourse[] {
  return courses.filter(c =>
    doesHeavenOvercomeEarth(c.heaven, c.earth) ||
    doesEarthOvercomeHeaven(c.heaven, c.earth)
  )
}

/** 상극하(上剋下)인 과 목록 */
export function getUpperOvercoming(courses: FourCourse[]): FourCourse[] {
  return courses.filter(c => doesHeavenOvercomeEarth(c.heaven, c.earth))
}

/** 하적상(下賊上)인 과 목록 */
export function getLowerOvercoming(courses: FourCourse[]): FourCourse[] {
  return courses.filter(c => doesEarthOvercomeHeaven(c.heaven, c.earth))
}

/**
 * 서로 다른 과가 몇 개인지 센다.
 * 천반·지반 짝이 겹치면 실제로는 3과(또는 2과)만 나오며,
 * 이때 별책법(別責法)·팔전법(八專法) 같은 특수 규칙이 적용된다.
 */
export function countDistinctCourses(courses: FourCourse[]): number {
  return new Set(courses.map(c => `${c.heaven}-${c.earth}`)).size
}

/**
 * 팔전일(八專日) 판정 — 일간의 기궁과 일지가 같은 칸인 날.
 * 甲寅·丁未·己未·庚申·癸丑 다섯 날이 해당된다.
 */
export function isEightSpecialized(dayStem: Stem, dayBranch: Branch): boolean {
  return STEM_PALACE[dayStem] === dayBranch
}

export { BRANCHES, branchIndex }
