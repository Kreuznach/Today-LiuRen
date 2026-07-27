/**
 * labels.ts — 화면 표기 전용 (계산 로직에는 영향 없음)
 * Rimora 원본 utils/labels.ts 중 이 앱에서 쓰는 표기만 이식했다.
 */
import type { Branch } from './types'

const BRANCH_HANJA: Record<Branch, string> = {
  zi: '子', chou: '丑', yin: '寅', mao: '卯',
  chen: '辰', si: '巳', wu: '午', wei: '未',
  shen: '申', you: '酉', xu: '戌', hai: '亥',
}

const BRANCH_KOREAN: Record<Branch, string> = {
  zi: '자', chou: '축', yin: '인', mao: '묘',
  chen: '진', si: '사', wu: '오', wei: '미',
  shen: '신', you: '유', xu: '술', hai: '해',
}

/** 지지 — 한자 + 한글 병기 (예: 子(자)) */
export function branchLabel(b: Branch): string {
  return `${BRANCH_HANJA[b]}(${BRANCH_KOREAN[b]})`
}
