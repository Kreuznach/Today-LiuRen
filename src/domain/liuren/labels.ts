/**
 * labels.ts — 화면 표기 전용 (계산 로직에는 영향 없음)
 * 화면에는 한자 대신 누구나 아는 쉬운 말만 쓴다.
 */
import type { Branch, HeavenlyGeneral, Strength } from './types'

const BRANCH_KOREAN: Record<Branch, string> = {
  zi: '자', chou: '축', yin: '인', mao: '묘',
  chen: '진', si: '사', wu: '오', wei: '미',
  shen: '신', you: '유', xu: '술', hai: '해',
}

/** 12칸을 누구나 아는 열두 띠 동물 이름으로 바꾼 표기 */
const BRANCH_ANIMAL: Record<Branch, string> = {
  zi: '쥐', chou: '소', yin: '호랑이', mao: '토끼',
  chen: '용', si: '뱀', wu: '말', wei: '양',
  shen: '원숭이', you: '닭', xu: '개', hai: '돼지',
}

/** 화면용 쉬운 표기 — 띠 동물 + 한글 (예: 쥐(자)) */
export function branchLabel(b: Branch): string {
  return `${BRANCH_ANIMAL[b]}(${BRANCH_KOREAN[b]})`
}

/**
 * 띠 동물 이모지 — 글자를 못 읽어도 칸을 구분할 수 있게 돕는다.
 * 오래된 기기에서도 보이도록 유니코드 6.0 이전 이모지만 쓴다.
 */
const BRANCH_EMOJI: Record<Branch, string> = {
  zi: '🐭', chou: '🐮', yin: '🐯', mao: '🐰', chen: '🐲', si: '🐍',
  wu: '🐴', wei: '🐑', shen: '🐵', you: '🐔', xu: '🐶', hai: '🐷',
}

/** 이모지가 붙은 칸 이름 (예: 🐭 쥐(자)) */
export function branchLabelWithEmoji(b: Branch): string {
  return `${BRANCH_EMOJI[b]} ${branchLabel(b)}`
}

/** 기운 카드 12장의 그림 이모지 — 카드 이름만 봐도 성격이 떠오르게 한다. */
const GENERAL_EMOJI: Record<HeavenlyGeneral, string> = {
  귀인: '👑', 등사: '🐍', 주작: '🐦', 육합: '🤝', 구진: '⛰️', 청룡: '🐉',
  천공: '☁️', 백호: '🐅', 태상: '📜', 현무: '🐢', 태음: '🌙', 천후: '👸',
}

export function generalEmoji(g: HeavenlyGeneral): string {
  return GENERAL_EMOJI[g]
}

/** 힘의 세기를 5칸 막대로 — 숫자보다 한눈에 보인다. (왕=5칸 … 사=1칸) */
const STRENGTH_LEVEL: Record<Strength, number> = { 왕: 5, 상: 4, 휴: 3, 수: 2, 사: 1 }

export function strengthBar(s: Strength): string {
  const level = STRENGTH_LEVEL[s]
  return '●'.repeat(level) + '○'.repeat(5 - level)
}

/** 힘의 세기(왕상휴수사)를 화면용 쉬운 말로 */
const STRENGTH_PLAIN: Record<Strength, string> = {
  왕: '아주 셈', 상: '세지는 중', 휴: '쉬어 감', 수: '막혀 있음', 사: '많이 약함',
}

export function strengthLabel(s: Strength): string {
  return STRENGTH_PLAIN[s]
}

