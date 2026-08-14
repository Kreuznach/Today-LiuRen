/**
 * labels.ts — 화면 표기 전용 (계산 로직에는 영향 없음)
 * 화면에는 한자 대신 누구나 아는 쉬운 말만 쓴다.
 */
import type { Branch, Strength } from './types'

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

/** 힘의 세기(왕상휴수사)를 화면용 쉬운 말로 */
const STRENGTH_PLAIN: Record<Strength, string> = {
  왕: '아주 셈', 상: '세지는 중', 휴: '쉬어 감', 수: '막혀 있음', 사: '많이 약함',
}

export function strengthLabel(s: Strength): string {
  return STRENGTH_PLAIN[s]
}

