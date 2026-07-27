/**
 * platform/apps-in-toss/environment.ts
 * 앱인토스(Apps in Toss) 런타임 여부 확인과 공통 동작(앱 종료) 래퍼.
 * AIT 미지원 환경(개발 서버·일반 브라우저)에서는 안전하게 아무 동작도 하지 않는다.
 */
import { GoogleAdMob, closeView } from '@apps-in-toss/web-framework'

/** 미니앱 종료 — AIT 미지원 환경에서는 아무 동작도 하지 않는다. */
export function closeApp(): void {
  closeView().catch(() => {})
}

/** 현재 런타임이 앱인토스(AIT) WebView인지 확인한다. */
export function isAitSupported(): boolean {
  try {
    return GoogleAdMob.loadAppsInTossAdMob.isSupported() === true
  } catch {
    return false
  }
}
