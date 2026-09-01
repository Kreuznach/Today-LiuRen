/**
 * features/ads/rewardAd.ts
 * 보상형 광고 래퍼 — Today-RPS(D:\Projects\CodingLan\Today-RPS)의 광고 연동 방식을 그대로 따른다.
 *
 * AIT 환경: loadAppsInTossAdMob → showAppsInTossAdMob 두 단계로 동작한다.
 *   - loaded 이벤트 수신 시 광고 준비 완료
 *   - userEarnedReward 이벤트 수신 시 보상 획득 확정
 *   - dismissed 이벤트 수신 시 최종 결과를 반환한다(보상 미획득이면 cancelled)
 * 개발/데스크톱 환경(AIT 미지원)에서는 1.2초 지연 후 completed 를 반환하는 Mock으로 폴백한다.
 *
 * 보상은 반드시 status === 'completed' 인 경우에만 지급해야 한다.
 * (광고 콜백 중복 실행 방지를 위해 호출 시점에 loading 가드를 둔다.)
 */
import { GoogleAdMob } from '@apps-in-toss/web-framework'
import { isAitSupported } from '../../platform/apps-in-toss/environment'

export type RewardAdResult =
  | { status: 'completed' }
  | { status: 'cancelled' }
  | { status: 'failed'; error?: unknown }

export type RewardAdSlot = 'detail' | 'extraQuestion'

const ISSUED_AD_GROUP_ID: Record<RewardAdSlot, string> = {
  detail: 'ait.v2.live.13dd43c6c51f4add',
  extraQuestion: 'ait.v2.live.57e003203911488c',
}

const AD_GROUP_ID_ENV: Record<RewardAdSlot, string | undefined> = {
  detail: import.meta.env.VITE_AIT_REWARDED_DETAIL_AD_GROUP_ID,
  extraQuestion: import.meta.env.VITE_AIT_REWARDED_EXTRA_QUESTION_AD_GROUP_ID,
}

function resolveAdGroupId(slot: RewardAdSlot): string {
  // 환경변수가 비었거나 test 값이어도, 실제 발급된 live ID만 사용한다.
  const fromEnv = AD_GROUP_ID_ENV[slot]?.trim()
  if (fromEnv && fromEnv.startsWith('ait.v2.live.')) return fromEnv
  return ISSUED_AD_GROUP_ID[slot]
}

let isShowingAd = false

/**
 * 보상형 광고를 시청시키고 결과를 반환한다.
 * 이미 광고가 표시 중이면 중복 호출을 막기 위해 즉시 cancelled 를 반환한다.
 */
export async function watchRewardAd(slot: RewardAdSlot): Promise<RewardAdResult> {
  if (isShowingAd) return { status: 'cancelled' }
  isShowingAd = true
  try {
    if (!isAitSupported()) {
      // 개발/데스크톱 Mock — 실제 앱인토스 환경이 아닐 때만 사용한다.
      await new Promise(resolve => setTimeout(resolve, 1200))
      return { status: 'completed' }
    }

    const adGroupId = resolveAdGroupId(slot)

    await new Promise<void>((resolve, reject) => {
      const cleanup = GoogleAdMob.loadAppsInTossAdMob({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === 'loaded') {
            cleanup()
            resolve()
          }
        },
        onError: (error) => {
          cleanup()
          reject(error)
        },
      })
    })

    return await new Promise<RewardAdResult>((resolve) => {
      let rewarded = false
      GoogleAdMob.showAppsInTossAdMob({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === 'userEarnedReward') rewarded = true
          if (event.type === 'dismissed') resolve(rewarded ? { status: 'completed' } : { status: 'cancelled' })
          if (event.type === 'failedToShow') resolve({ status: 'failed' })
        },
        onError: (error) => resolve({ status: 'failed', error }),
      })
    })
  } catch (error) {
    return { status: 'failed', error }
  } finally {
    isShowingAd = false
  }
}
