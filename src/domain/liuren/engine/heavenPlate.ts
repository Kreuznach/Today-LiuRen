/**
 * heavenPlate.ts — 천반(天盤) 포설 모듈
 *
 * 육임의 핵심 규칙은 **월장가시(月將加時)** 다.
 * "월장(태양의 자리)을 점시(질문한 시각) 위에 올린다"는 뜻이다.
 *
 *   지반(地盤)은 바닥에 고정된 12방위 시계판이고,
 *   천반(天盤)은 그 위에서 돌아가는 투명한 시계판이다.
 *   점시 칸 위에 월장을 맞춰 놓으면 나머지 11칸도 자동으로 정해진다.
 *
 * 이 회전량(offset)이 틀리면 사과·삼전·천장이 전부 어긋나므로
 * 육임 계산에서 가장 중요한 단계다.
 */
import type { Branch } from '../types'
import { BRANCHES, branchIndex } from './elements'

/**
 * 천반을 구성한다. (월장가시)
 *
 * @param yueJiang   월장(月將) — 태양이 있는 지지
 * @param hourBranch 점시(占時) — 질문이 생긴 시각의 지지
 * @returns 지반 지지 → 그 위에 올라온 천반 지지
 */
export function buildHeavenPlate(
  yueJiang: Branch,
  hourBranch: Branch
): Record<Branch, Branch> {
  const offset = (branchIndex(yueJiang) - branchIndex(hourBranch) + 12) % 12
  const result = {} as Record<Branch, Branch>

  for (let i = 0; i < 12; i++) {
    result[BRANCHES[i]] = BRANCHES[(i + offset) % 12]
  }

  return result
}

/** 천반이 지반에 대해 몇 칸 돌아갔는지(0~11) */
export function getPlateOffset(heavenPlate: Record<Branch, Branch>): number {
  return (branchIndex(heavenPlate['zi']) - branchIndex('zi') + 12) % 12
}

/** 복음(伏吟): 천반과 지반이 완전히 겹친 상태 — 월장과 점시가 같을 때 */
export function isFuyin(heavenPlate: Record<Branch, Branch>): boolean {
  return getPlateOffset(heavenPlate) === 0
}

/** 반음(返吟): 천반이 지반과 정반대로 놓인 상태 — 월장과 점시가 충(沖)일 때 */
export function isFanyin(heavenPlate: Record<Branch, Branch>): boolean {
  return getPlateOffset(heavenPlate) === 6
}

/**
 * 특정 천반 지지가 어느 지반 칸에 놓여 있는지 찾는다.
 */
export function findEarthForHeaven(
  heavenPlate: Record<Branch, Branch>,
  heavenBranch: Branch
): Branch {
  for (const [earth, heaven] of Object.entries(heavenPlate) as [Branch, Branch][]) {
    if (heaven === heavenBranch) return earth
  }
  // 천반은 항상 12칸 전단사이므로 여기에 도달하지 않는다 (방어용)
  return heavenBranch
}
