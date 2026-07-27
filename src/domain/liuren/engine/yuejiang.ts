/**
 * yuejiang.ts — 월장(月將) 계산 모듈
 *
 * 월장은 "지금 태양이 어느 자리에 있는가"를 12지지로 나타낸 값이다.
 * 24절기 중 중기(中氣)를 지날 때마다 한 칸씩 뒤로(역행) 바뀐다.
 *
 * 예전에는 "2월 19일 이후" 같은 고정 날짜 표를 썼는데,
 * 절기 날짜는 해마다 하루씩 달라져서 오차가 생겼다.
 * 지금은 태양 황경을 직접 계산해 어떤 연도든 정확하게 맞춘다.
 */
import type { Branch } from '../types'
import { BRANCHES } from './elements'
import { getSolarLongitude } from './calendar'

/** 중기(中氣)와 그때부터 쓰는 월장 */
export const YUEJIANG_TABLE: Array<{ term: string; longitude: number; branch: Branch }> = [
  { term: '우수', longitude: 330, branch: 'hai' },   // 亥 등명(登明)
  { term: '춘분', longitude: 0, branch: 'xu' },      // 戌 하괴(河魁)
  { term: '곡우', longitude: 30, branch: 'you' },    // 酉 종괴(從魁)
  { term: '소만', longitude: 60, branch: 'shen' },   // 申 전송(傳送)
  { term: '하지', longitude: 90, branch: 'wei' },    // 未 소길(小吉)
  { term: '대서', longitude: 120, branch: 'wu' },    // 午 승광(勝光)
  { term: '처서', longitude: 150, branch: 'si' },    // 巳 태을(太乙)
  { term: '추분', longitude: 180, branch: 'chen' },  // 辰 천강(天罡)
  { term: '상강', longitude: 210, branch: 'mao' },   // 卯 태충(太衝)
  { term: '소설', longitude: 240, branch: 'yin' },   // 寅 공조(功曹)
  { term: '동지', longitude: 270, branch: 'chou' },  // 丑 대길(大吉)
  { term: '대한', longitude: 300, branch: 'zi' },    // 子 신후(神后)
]

/**
 * 주어진 시각의 월장(月將)을 반환한다.
 *
 * 계산 방법
 *  1) 태양 황경을 구한다 (0°~360°)
 *  2) 우수(330°)를 출발점으로 삼아 30°마다 한 칸씩 센다
 *  3) 亥에서 시작해 한 칸씩 역행한 지지가 월장이다
 */
export function getYueJiang(date: Date): Branch {
  const longitude = getSolarLongitude(date)
  const step = Math.floor((((longitude - 330) % 360) + 360) % 360 / 30)
  return BRANCHES[(11 - step + 12) % 12]   // 11 = 亥
}

/** 월장의 전통 이름(등명·하괴 …)을 반환한다. */
export function getYueJiangName(branch: Branch): string {
  const names: Record<Branch, string> = {
    zi: '신후(神后)', chou: '대길(大吉)', yin: '공조(功曹)', mao: '태충(太衝)',
    chen: '천강(天罡)', si: '태을(太乙)', wu: '승광(勝光)', wei: '소길(小吉)',
    shen: '전송(傳送)', you: '종괴(從魁)', xu: '하괴(河魁)', hai: '등명(登明)'
  }
  return names[branch]
}
