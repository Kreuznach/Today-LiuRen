import { defineConfig } from '@apps-in-toss/web-framework/config'

/**
 * apps-in-toss.config.ts
 * Apps in Toss(WebView) 미니앱 설정 파일 (SDK 3.x 형식)
 *
 * [심사 제출 전 확인 사항]
 * - 아이콘: SDK 3.x부터는 이 파일이 아니라 Toss 파트너 콘솔에서 앱 아이콘을 등록/교체함
 * - brand.primaryColor: 디자인 확정 후 변경 가능 (현재 placeholder)
 */
export default defineConfig({
  appName: 'today-liuren',

  brand: {
    primaryColor: '#9C3B2A'
  },

  webBundleDir: 'dist',
  permissions: [],

  // 내비게이션 바 뒤로 가기 버튼 비활성화:
  // 앱 내 TopBar의 단일 백 버튼으로 히스토리 뒤로 가기 / 앱 종료를 처리합니다.
  navigationBar: {
    withBackButton: false,
  }
})
