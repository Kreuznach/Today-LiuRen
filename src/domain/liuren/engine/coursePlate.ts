/**
 * coursePlate.ts — 과전(課傳) 계산 오케스트레이터
 *
 * 흩어져 있던 계산 순서를 한곳에 모아, 화면(UI)은 결과만 받아 쓰도록 한다.
 *
 * 계산 순서
 *   ① 점시·일진·월지·공망            (calendar)
 *   ② 월장                            (yuejiang)
 *   ③ 천반 — 월장가시                 (heavenPlate)
 *   ④ 사과                            (fourCourses)
 *   ⑤ 12천장                          (generals)
 *   ⑥ 삼전 + 과체 — 구종법            (threeTransmissions)
 *   ⑦ 삼전에 천장·강도·역할·공망을 붙여 최종 결과 조립
 */
import type {
  Branch, CoursePlatResult, QueryType, Transmission, TransmissionPosition
} from '../types'
import {
  getDayStemBranch, getHourBranch, getMonthBranch, getVoidBranches, isDaytime
} from './calendar'
import { getYueJiang } from './yuejiang'
import { buildHeavenPlate } from './heavenPlate'
import { buildFourCourses } from './fourCourses'
import { buildGeneralMap } from './generals'
import { buildCourseStructure } from './threeTransmissions'
import { branchStrength, relationToDayStem } from './elements'

const POSITIONS: TransmissionPosition[] = ['초전', '중전', '말전']

/**
 * 하나의 시각과 질문 유형으로 과전 전체를 계산한다.
 */
export function calculateCoursePlat(date: Date, queryType: QueryType): CoursePlatResult {
  // ① 시간 좌표
  const { stem: dayStem, branch: dayBranch } = getDayStemBranch(date)
  const hourBranch = getHourBranch(date)
  const monthBranch = getMonthBranch(date)
  const voidBranches = getVoidBranches(dayStem, dayBranch)
  const isDay = isDaytime(date)

  // ②③ 월장 → 천반(월장가시)
  const yueJiang = getYueJiang(date)
  const heavenPlate = buildHeavenPlate(yueJiang, hourBranch)

  // ④⑤ 사과 → 천장
  const fourCourses = buildFourCourses(dayStem, dayBranch, heavenPlate)
  const generalMap = buildGeneralMap(dayStem, isDay, heavenPlate)

  // ⑥ 삼전 + 과체
  const structure = buildCourseStructure(dayStem, dayBranch, heavenPlate, fourCourses)

  // ⑦ 삼전 상세 정보 조립
  const voidSet = new Set<Branch>(voidBranches)
  const threeTransmissions: Transmission[] = structure.branches.map((branch, i) => ({
    position: POSITIONS[i],
    branch,
    general: generalMap[branch],
    strength: branchStrength(branch, monthBranch),
    relation: relationToDayStem(branch, dayStem),
    isVoid: voidSet.has(branch)
  }))

  return {
    date,
    dayStem,
    dayBranch,
    hourBranch,
    monthBranch,
    yueJiang,
    isDay,
    voidBranches,
    heavenPlate,
    fourCourses,
    threeTransmissions,
    generalMap,
    courseName: structure.courseName,
    methodName: structure.methodName,
    patternNames: structure.patternNames,
    queryType
  }
}
