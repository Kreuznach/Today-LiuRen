# 이식 작업 요약 (MIGRATION_SUMMARY)

이 문서는 "오늘의 육임점" 앱을 만들 때 무엇을 어디서 가져왔고, 무엇을 새로 만들었는지
간단히 정리한 문서예요. (150줄 이내로 짧게 씁니다)

## 1. 어디서 무엇을 가져왔나요?

### Rimora (`D:\Projects\CodingLan\Rimora`) → 육임 계산 두뇌

- `src/engine/*.ts` (달력→간지, 천반, 사과, 삼전, 12천장, 왕상휴수사, 로컬 해석 문장 생성 등)
  → **거의 그대로 복사**해서 `src/domain/liuren/engine/`에 옮겼어요. 계산 공식을 바꾸면 점괘가
  달라지므로, 코드를 고치지 않고 그대로 가져왔습니다.
- `src/data/courses.json`, `src/data/generals.json` (해석 문장 사전) → 그대로 복사.
- `src/data/glossary.ts` (용어 사전) → 그대로 복사(용어가 어려운 사용자를 위한 도움말 모달에 사용).
- `src/types.ts` → 계산에 필요한 부분만 옮겼어요(AI 응답 관련 타입 등은 이번 MVP에 안 쓰여서 제외).

### Today-RPS (`D:\Projects\CodingLan\Today-RPS`) → 앱인토스(토스 미니앱) 뼈대

- `granite.config.ts`, `vite.config.js` → 거의 그대로 참고해 새 프로젝트에 맞게 값만 바꿈
  (`appName`, `displayName`, 아이콘 색 등).
- `@apps-in-toss/web-framework`의 `GoogleAdMob`(보상형 광고), `closeView`(앱 종료) 사용 방식
  → `features/ads/rewardAd.ts`, `platform/apps-in-toss/environment.ts`에 그대로 이식.
- KST(한국 시간) 기준 "오늘 날짜" 계산 방식(`Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })`)
  → `platform/storage/dailyUsage.ts`에 이식.
- `ait build` 명령으로 `.ait` 파일을 만드는 방식 → 그대로 사용(별도 커스텀 스크립트 불필요, 확인됨).

## 2. 새로 만든 것

- `domain/liuren/calculateLiurenReading.ts` — Rimora 엔진을 한 번만 부르면 되는 화면용 함수.
  기획서 8장에서 요구한 5개 카테고리(관계/일·사업/선택·결정/분실·이동/기타)를 Rimora 원본의
  6개 내부 분류(사업/연애/건강/분실물/여행/기타)로 매핑해서 해석 문장의 품질을 지켰어요.
- 텍스트 분류(긍정 우세/신중한 긍정/중립/변수 많음/주의 필요) — 실제 계산된 기운 점수
  (`score.ts`의 긍정/중립/부정 점수)를 기준으로 정하며, 난수(랜덤)는 전혀 쓰지 않습니다.
- `features/question`, `features/reading` — 질문 화면과 결과 화면(React 컴포넌트).
- `features/reading/detailInterpretation.ts` — 심화 해석 인터페이스 + 로컬 fallback.
  AI 서버가 아직 없어서 지금은 항상 계산 결과 기반 문장을 보여주고, AI 연결 지점은
  주석으로 표시만 해뒀어요(비밀키를 클라이언트에 두지 않기 위함).
- `platform/storage/dailyUsage.ts` — 하루 질문 2회 제한(기본 1회 무료 + 광고 시청 1회) 로직.

## 3. 하지 않은 것 (MVP 범위 밖)

- Supabase 사용 안 함 — 로그인/여러 기기 동기화가 필요 없는 MVP라서 로컬 저장(localStorage)만
  사용했어요. 나중에 필요해지면 `ora_` 접두사 규칙에 따라 마이그레이션 SQL만 먼저 작성해야 해요.
- 실제 AI 해석 연동 안 함 — 인터페이스와 폴백만 구현.
- 관리자 페이지, 결제, 다국어, 소셜 로그인 — 만들지 않았어요(기획서에서 제외 항목으로 명시).

## 4. 확인한 것

- `npm test` — 9개 테스트 모두 통과. 그중 5개는 Rimora 원본 엔진으로 미리 계산해 둔
  대표 시각 5개(오전/오후/자정 직전/자정 직후/연말)와 **완전히 같은 결과**가 나오는지 비교하는
  골든 테스트예요(`tests/fixtures/rimora-golden-cases.json`).
- `npm run typecheck` — 오류 없음.
- `npm run build` — 성공 (`dist/` 생성).
- `npm run build:ait` — 성공 (`today-liuren.ait` 생성, deploymentId 자동 발급 확인).

## 5. 보안 관련 확인 사항

- `.env.example`에는 실제 값(비밀키)을 넣지 않고 변수 이름만 넣었어요.
- ⚠️ 참고로 `Today-RPS`의 `.env.example`에는 Supabase URL/anon key/**service_role key**가
  실제 값으로 들어 있었어요. 이번 이식본에는 절대 복사하지 않았고, 원본 파일도 수정하지
  않았습니다(원본은 읽기 전용으로만 확인). Today-RPS 저장소 관리자가 별도로 확인/교체하는 것을
  권장해요.
- 광고 보상은 `status === 'completed'`일 때만 지급하도록 만들었고, 광고 표시 중 중복 호출을
  막는 가드(`isShowingAd`)를 두었어요.

## 6. 사용자가 나중에 채워야 할 값

- `granite.config.ts`의 `brand.icon` (심사용 아이콘 URL)
- `.env.local`의 `VITE_AIT_REWARDED_DETAIL_AD_GROUP_ID`, `VITE_AIT_REWARDED_EXTRA_QUESTION_AD_GROUP_ID`
- (선택) Supabase, AI API 값 — 지금은 비워 둬도 앱이 정상 동작함
