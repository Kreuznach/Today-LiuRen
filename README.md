# 오늘의 육임점 (Today-LiuRen)

옛날부터 내려오는 점술인 **육임점**을 요즘 스마트폰 앱처럼 쉽게 만든 서비스예요.
궁금한 것을 물어보면, "지금 이 순간의 시간"을 이용해서 계산한 결과를 보여줘요.
이 앱은 토스 앱 안에서 열리는 **미니앱(앱인토스)**으로 만들어졌어요.

> ⚠️ 이 앱은 재미로 보는 참고용이에요. 중요한 결정은 꼭 어른이나 전문가와 상의하세요.

---

## 1. 이 앱은 무엇을 할 수 있나요?

1. 카테고리(관계 / 일·사업 / 선택·결정 / 분실·이동 / 기타)를 고르고 질문을 적어요.
2. "결과 보기"를 누르면 **기본 해석**을 광고 없이 바로 볼 수 있어요.
3. 광고를 하나 보면 더 자세한 **심화 해석**(지금 할 행동, 피해야 할 행동 등)을 볼 수 있어요.
4. 하루에 질문은 2번까지만 할 수 있어요. (1번째는 무료, 2번째는 광고를 본 뒤)

## 2. 폴더 구조 (어디에 뭐가 있나요?)

```
src/
  domain/liuren/     ← 육임 계산 "두뇌" 부분 (Rimora 원본 계산 로직을 그대로 가져옴)
    engine/          ← 실제 계산 공식들 (날짜→간지, 천반, 사과, 삼전 등)
    data/            ← 결과를 문장으로 바꿀 때 쓰는 사전 데이터(JSON)
    calculateLiurenReading.ts  ← 화면에서 부르는 메인 함수 하나
  features/
    question/        ← 질문 입력 화면
    reading/          ← 결과(과전도, 초전·중전·말전, 심화 해석) 화면
    ads/              ← 보상형 광고(광고 보면 더 보여주기) 담당
  platform/
    apps-in-toss/     ← 토스 앱 환경인지 확인하고, 앱 닫기 같은 기능
    storage/          ← 하루에 몇 번 물어봤는지 저장(휴대폰 안에만 저장)
  components/         ← 상단바, 토스트 알림 같은 공통 화면 조각
  context/            ← 화면 전환, 알림 등을 앱 전체에서 같이 쓰는 상태
tests/
  engine.test.ts               ← 계산이 맞는지 확인하는 테스트
  fixtures/rimora-golden-cases.json ← 원본(Rimora) 계산 결과를 미리 저장해둔 정답지
docs/
  INIT_BUILD_PROMPT.md ← 이 프로젝트를 만들 때 사용한 지시서
  MIGRATION_SUMMARY.md ← 무엇을 어떻게 옮겨왔는지 요약한 문서
```

## 3. 개발 서버 켜보기

컴퓨터에서 실제 앱처럼 미리 보고 싶다면 아래 순서대로 따라 하세요.

```bash
# 1) 필요한 부품(패키지)들을 설치해요 (처음 한 번만)
npm install

# 2) 개발 서버를 켜요
npm run dev
```

터미널에 나오는 주소(예: http://localhost:5173)를 브라우저에서 열면 앱을 볼 수 있어요.

## 4. 테스트 · 타입 검사 · 빌드 (검증 순서)

아래 순서대로 하나씩 실행하면 돼요. 문제가 없으면 다음 단계로 넘어가세요.

```bash
# ① 육임 계산이 정확한지 확인 (원본 Rimora와 똑같은 결과가 나오는지 비교)
npm test

# ② 타입(글자 규칙)이 잘못된 곳은 없는지 확인
npm run typecheck

# ③ 실제로 배포할 수 있는 파일 만들기
npm run build
```

`npm test`를 실행하면 아래처럼 나와야 정상이에요.

```
육임 엔진 테스트 결과: 9개 통과, 0개 실패
```

## 5. `.ait` 파일 만들기 (토스에 올릴 파일)

`.ait`는 이 앱을 토스 앱 안에 넣을 수 있게 포장한 파일이에요. 아래 명령어 하나면 만들어져요.

```bash
npm run build:ait
```

성공하면 프로젝트 맨 위 폴더에 `today-liuren.ait` 파일이 생겨요. 이 파일을
[Toss 파트너 콘솔(In-App Builder)](https://developers-apps-in-toss.toss.im/)에 업로드하면
실제 토스 앱에서 테스트해 볼 수 있어요. (업로드는 이 저장소 밖에서, 토스 계정으로 직접 해야 해요.)

## 6. 올리기 전에 꼭 바꿔야 하는 값

실제로 출시하려면 아래 값을 바꿔주세요.

| 무엇을 | 어디서 | 비고 |
| --- | --- | --- |
| 앱 이름/아이콘 | `granite.config.ts`의 `brand` | 토스 콘솔에서 아이콘 심사 후 URL 발급받기 |
| 광고 그룹 ID | `.env.local`(및 `.env.example`)의 `VITE_AIT_REWARDED_*` | ✅ 발급 완료 — 정밀 분석용 `ait.v2.live.13dd43c6c51f4add`(`detail`), 질문권 추가용 `ait.v2.live.57e003203911488c`(`extraQuestion`) 적용됨 |
| 광고 환경 설정 | `.env.local`(및 `.env.example`)의 `VITE_AD_ENV` | ✅ `production`으로 고정 — dev/build 여부와 관계없이 항상 실제 광고 ID를 사용함 |
| Supabase 값(선택) | `.env.local`의 `VITE_SUPABASE_*` | 지금은 사용 안 함(로컬 저장만 사용) |
| AI 해석 서버(선택) | `AI_API_ENDPOINT`, `AI_API_SECRET` | 아직 준비 안 됨, 나중에 서버를 통해서만 연결 |

`.env.example` 파일을 복사해서 `.env.local`이라는 이름으로 만들고, 그 안에 진짜 값을 채워 넣으세요.
`.env.local`은 깃(git)에 올라가지 않도록 이미 설정돼 있어요.

## 7. 참고

- 육임 계산 규칙은 `D:\Projects\CodingLan\Rimora` 프로젝트의 계산 로직을 그대로 옮겨온 것이며,
  값이 똑같이 나오는지 `tests/engine.test.ts`에서 확인하고 있어요.
- 앱인토스(토스 미니앱) 뼈대와 광고/저장 방식은 `D:\Projects\CodingLan\Today-RPS` 프로젝트의 구조를 참고했어요.
