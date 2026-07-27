# Rimora 앱인토스 이식 작업 — 크레딧 최적화 프롬프트

## 0. 작업 경로

```text
RIMORA_SOURCE_PATH="D:\Projects\CodingLan\Rimora"
TODAY_RPS_SOURCE_PATH="D:\Projects\CodingLan\Today-RPS"
TARGET_PROJECT_PATH="D:\Projects\CodingLan\Today-LiuRen"

TARGET_APP_NAME="Today_LiuRen"
TARGET_DISPLAY_NAME="오늘의 육임점"
```

---

# 1. 목표

다음 두 프로젝트를 참고하여 `TARGET_PROJECT_PATH`에 앱인토스용 육임점 서비스를 구현한다.

* `RIMORA_SOURCE_PATH`

  * 육임 계산 로직
  * 초전·중전·말전
  * 천반·지반·사과·삼전
  * 기본 해석과 결과 표현

* `TODAY_RPS_SOURCE_PATH`

  * 앱인토스 프로젝트 구조
  * 최신 SDK 적용 방식
  * `granite.config.ts`
  * 개발·빌드 명령
  * `.ait` 생성 방식
  * 광고 및 일일 사용 제한 구조

단순 분석으로 끝내지 말고 실제 코드 생성, 테스트, 프로덕션 빌드와 `.ait` 생성을 진행한다.

---

# 2. 크레딧 절약 원칙

작업 중 다음 규칙을 반드시 지킨다.

## 2.1 필요한 파일만 읽기

두 프로젝트 전체를 무차별적으로 읽지 않는다.

먼저 다음 파일만 확인한다.

```text
package.json
lock 파일
README
vite.config.*
tsconfig.*
granite.config.*
src 진입 파일
라우터
앱인토스 관련 파일
육임 계산 관련 파일
Supabase 관련 파일
광고 관련 파일
```

검색 결과를 이용해 필요한 파일만 추가로 연다.

다음 디렉터리는 검색과 분석에서 제외한다.

```text
node_modules
dist
build
coverage
.git
.next
.vercel
.wrangler
public의 대용량 이미지
기존 .ait 파일
```

## 2.2 중복 분석 금지

한 번 확인한 파일을 특별한 이유 없이 반복해서 읽지 않는다.

이미 확인한 사실을 다시 조사하지 않는다.

## 2.3 공식 문서 조회 제한

앱인토스 관련 공식 문서는 다음 경우에만 확인한다.

* Today-RPS의 SDK 버전이 현재 설치 가능한 버전과 충돌
* 빌드 또는 `.ait` 생성 명령이 실패
* 기존 API가 deprecated 또는 제거된 것으로 확인
* 광고 API 타입 오류 발생

Today-RPS 구조가 정상 동작하고 최신 SDK와 호환된다면 불필요한 웹 조사를 하지 않는다.

## 2.4 문서 산출물 최소화

여러 개의 장문 분석 문서를 만들지 않는다.

다음 문서만 생성한다.

```text
README.md
docs/MIGRATION_SUMMARY.md
.env.example
```

`MIGRATION_SUMMARY.md`는 150줄 이내로 작성한다.

## 2.5 테스트 횟수 최소화

모든 파일 수정마다 전체 빌드를 반복하지 않는다.

다음 순서로 검증한다.

1. 육임 로직 이식 후 관련 단위 테스트
2. UI 연결 후 타입 검사
3. 전체 구현 완료 후 lint
4. 마지막에 프로덕션 빌드와 `.ait` 생성

동일한 명령은 코드 변경 없이 반복하지 않는다.

## 2.6 과도한 리팩터링 금지

MVP에 필요하지 않은 다음 작업은 하지 않는다.

* 전 프로젝트 디자인 시스템 교체
* 모든 컴포넌트 재작성
* 사용하지 않는 코드 정리
* Today-RPS 전체 구조 개선
* Rimora 원본 리팩터링
* 대규모 타입 구조 변경
* 테스트 커버리지 100% 달성
* 불필요한 애니메이션
* 관리자 페이지
* 유료 결제
* 다국어
* 소셜 로그인

---

# 3. 원본 프로젝트 보호

`RIMORA_SOURCE_PATH`와 `TODAY_RPS_SOURCE_PATH`는 읽기 전용으로 취급한다.

금지 사항:

* 원본 파일 수정
* 원본 파일 삭제
* 원본에서 패키지 설치
* 원본 lock 파일 변경
* 원본 `.env` 수정
* 원본 빌드 결과 덮어쓰기
* 원본 Supabase 마이그레이션 실행

모든 변경은 `TARGET_PROJECT_PATH`에서만 수행한다.

환경변수와 비밀키는 복사하지 않는다.

`.env.example`에는 변수 이름만 작성한다.

---

# 4. 1단계: 두 프로젝트의 핵심 구조 확인

먼저 다음 항목만 간결하게 분석한다.

## Rimora

* 육임 계산 시작 함수
* 점시 날짜·시간 입력 형식
* 천간·지지 계산
* 천반·지반 계산
* 사과 계산
* 초전·중전·말전 계산
* 기본 해석 생성
* 과전도 렌더링
* AI 호출 여부
* 저장소 또는 Supabase 사용 여부

## Today-RPS

* 앱인토스 SDK 버전
* 앱 진입 구조
* `granite.config.ts`
* 개발 명령
* 빌드 명령
* `.ait` 생성 방식
* 앱인토스 환경 판별
* Storage 래퍼
* 보상형 광고 래퍼
* 일일 사용 횟수 관리

분석 결과는 채팅에 장문으로 출력하지 말고 `docs/MIGRATION_SUMMARY.md`에 간단히 기록한다.

분석 후 사용자 응답을 기다리지 말고 구현을 계속한다.

---

# 5. 2단계: 새 앱인토스 프로젝트 생성

`TARGET_PROJECT_PATH`에 Today-RPS 구조를 기준으로 새 프로젝트를 구성한다.

앱인토스 SDK는 작업 시점의 최신 안정 버전을 사용한다.

단, Today-RPS 버전이 정상 동작하며 공식 최신 안정 버전과 호환된다면 구조를 크게 변경하지 않는다.

필수 구성:

```text
src/
  app/
  pages/
  components/
  domain/
    liuren/
  features/
    question/
    reading/
    ads/
  platform/
    apps-in-toss/
    storage/
  lib/
```

실제 구조가 Today-RPS와 충돌한다면 Today-RPS 구조를 우선하되, 육임 도메인 로직은 UI와 분리한다.

---

# 6. 3단계: Rimora 육임 로직 이식

Rimora의 계산 로직을 새 프로젝트에 이식한다.

## 반드시 보존할 항목

* 동일한 점시 입력에 대한 동일한 계산 결과
* 천반과 지반
* 사과
* 초전
* 중전
* 말전
* 기존 기본 해석 규칙
* 과전도에 필요한 결과 데이터

## 금지 사항

* 랜덤 점괘로 대체
* AI가 계산 결과를 추측
* 일부 규칙 생략
* 계산이 어려운 부분을 임의 단순화
* 긍정·부정 난수 생성
* 원본 결과를 확인하지 않고 새 알고리즘 작성

가능하면 다음 형태의 순수 함수로 분리한다.

```ts
calculateLiurenReading({
  askedAt,
  category,
  question,
});
```

출력 타입에는 최소한 다음 데이터를 포함한다.

```ts
type LiurenReading = {
  askedAt: string;
  heavenPlate: unknown;
  earthPlate: unknown;
  fourLessons: unknown;
  firstTransmission: unknown;
  middleTransmission: unknown;
  finalTransmission: unknown;
  classification?: string;
  baseInterpretation: string;
};
```

실제 타입은 Rimora 원본 구조에 맞게 구체화한다.

---

# 7. 최소 동일성 테스트

과도한 테스트를 만들지 말고 대표 입력 5개만 선정한다.

필수 테스트:

1. 일반적인 오전 시각
2. 일반적인 오후 시각
3. 자정 직전
4. 자정 직후
5. 월말 또는 연말

각 입력에서 다음 값만 원본과 비교한다.

* 사과
* 초전
* 중전
* 말전
* 주요 분류값

원본 로직을 테스트에서 직접 호출하기 어렵다면 Rimora 결과를 fixture로 저장한다.

```text
tests/fixtures/rimora-golden-cases.json
```

불일치가 발생하면 UI 개발보다 계산 로직 수정이 우선이다.

---

# 8. 앱 사용자 흐름

MVP에는 다음 기능만 구현한다.

## 질문 화면

* 카테고리
* 질문 입력
* 현재 시각 자동 사용
* 점시 직접 입력 옵션
* 결과 보기
* 참고용 서비스 고지

카테고리:

```text
관계
일·사업
선택·결정
분실·이동
기타
```

## 기본 결과

광고 없이 제공한다.

* 전체 흐름
* 초전
* 중전
* 말전
* 핵심 조언
* 과전도
* 용어 도움말

통계적 확률처럼 오해할 수 있는 백분율은 화면에 사용하지 않는다.

다음과 같은 텍스트 분류를 사용한다.

```text
긍정 우세
신중한 긍정
중립
변수 많음
주의 필요
```

## 심화 결과

보상형 광고 완료 후 제공할 수 있는 구조를 만든다.

* 상세 해석
* 지금 할 행동
* 피해야 할 행동
* 예상 변수
* 한 문장 결론

초기에는 AI 연동이 없어도 앱이 동작해야 한다.

AI API가 준비되지 않았다면 인터페이스와 fallback만 구현한다.

---

# 9. 광고와 일일 이용 제한

Today-RPS의 구현 방식을 우선 재사용한다.

기본 정책:

```text
하루 첫 질문 기본 해석: 무료
첫 질문 상세 해석: 보상형 광고 후
하루 추가 질문 1회: 보상형 광고 후
무제한 질문: 제공하지 않음
```

광고 API를 다음과 같이 추상화한다.

```ts
type RewardAdResult =
  | { status: 'completed' }
  | { status: 'cancelled' }
  | { status: 'failed'; error?: unknown };
```

보상은 `completed`인 경우에만 지급한다.

다음을 방지한다.

* 광고 콜백 중복 실행
* 광고 실패 후 보상 지급
* 새로고침을 통한 제한 우회
* 날짜가 바뀌지 않았는데 무료 질문 초기화
* 한국 시간과 UTC 혼동

일일 상태는 `Asia/Seoul`을 기준으로 관리한다.

---

# 10. Supabase 사용 원칙

Supabase는 다음 기능이 실제로 필요한 경우에만 사용한다.

* 로그인 사용자별 질문 기록
* 여러 기기 간 이용 상태 동기화
* 광고 보상 중복 방지 서버 검증
* AI 해석 캐시
* 회고 데이터 저장

MVP에서 Local Storage만으로 충분하다면 Supabase DB를 새로 만들지 않는다.

## 10.1 DB 객체 접두사 규칙

Supabase에 사용자 정의 DB 객체를 생성해야 한다면 모든 객체 이름에 반드시 `ora_` 접두사를 붙인다.

적용 대상:

* 테이블
* 뷰
* Materialized View
* 함수
* RPC
* 트리거
* 인덱스
* 시퀀스
* Enum 또는 사용자 정의 타입
* RLS 정책 이름
* Storage Bucket
* Cron Job 이름

예시:

```text
ora_readings
ora_daily_usage
ora_ai_interpretation_cache
ora_followups
ora_get_daily_usage
ora_grant_reward
ora_readings_user_id_idx
ora_readings_insert_own
ora_readings_updated_at_trigger
```

컬럼명에는 `ora_` 접두사를 붙이지 않아도 된다.

다음 Supabase 기본 객체는 수정하거나 이름을 변경하지 않는다.

```text
auth.users
auth.identities
storage.objects
storage.buckets
```

`auth.users`를 참조하는 외래키는 허용한다.

예시:

```sql
create table if not exists public.ora_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  question_category text not null,
  question_text text,
  asked_at timestamptz not null,
  reading_data jsonb not null,
  created_at timestamptz not null default now()
);
```

## 10.2 자동 생성 제한

Supabase가 필요하다고 판단하더라도 바로 원격 DB에 적용하지 않는다.

다음 순서로 처리한다.

1. 필요한 이유를 판단
2. SQL 마이그레이션 파일 작성
3. SQL 문법 검사
4. RLS 정책 포함
5. 사용자에게 적용 파일과 명령 안내

사용자가 명시적으로 요청하지 않은 경우 원격 Supabase 프로젝트에 직접 마이그레이션을 실행하지 않는다.

마이그레이션 파일명 예시:

```text
supabase/migrations/<timestamp>_ora_initial_schema.sql
```

## 10.3 기존 DB 객체 처리

기존에 접두사가 없는 테이블이 발견되더라도 자동으로 이름을 변경하거나 삭제하지 않는다.

다음 중 하나를 선택한다.

* 기존 객체를 읽기 전용으로 재사용
* 새 `ora_` 객체 생성
* 호환 뷰 작성
* 사용자에게 충돌 보고

데이터 손실 가능성이 있는 DROP, RENAME, TRUNCATE는 실행하지 않는다.

## 10.4 RLS

새 테이블을 만들면 기본적으로 RLS를 활성화한다.

사용자 데이터는 다음 원칙을 따른다.

* 본인 데이터만 조회
* 본인 데이터만 생성
* 본인 데이터만 수정
* 본인 데이터만 삭제
* service role 키를 클라이언트에 노출하지 않음

정책명에도 `ora_` 접두사를 붙인다.

예시:

```sql
alter table public.ora_readings enable row level security;

create policy ora_readings_select_own
on public.ora_readings
for select
using (auth.uid() = user_id);
```

---

# 11. 환경변수

비밀값을 코드에 하드코딩하지 않는다.

`.env.example` 예시:

```text
VITE_AIT_APP_NAME=
VITE_AIT_REWARDED_DETAIL_AD_GROUP_ID=
VITE_AIT_REWARDED_EXTRA_QUESTION_AD_GROUP_ID=
VITE_AIT_BANNER_AD_GROUP_ID=

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

AI_API_ENDPOINT=
AI_API_SECRET=
```

AI 비밀키는 클라이언트의 `VITE_` 환경변수로 만들지 않는다.

---

# 12. 최종 검증

구현 완료 후 다음 순서로 한 번씩 실행한다.

```bash
<package-manager> run typecheck
<package-manager> run lint
<package-manager> test
<package-manager> run build
```

실제 `package.json`에 존재하는 명령만 사용한다.

빌드 후 다음을 확인한다.

* 앱 실행 가능 여부
* TypeScript 오류
* 육임 대표 테스트 통과
* `.ait` 파일 생성 여부
* `.ait` 생성 위치
* 운영 비밀값 포함 여부
* 운영 광고 ID 하드코딩 여부
* 원본 프로젝트 변경 여부

`.ait` 생성에 실패하면 같은 명령을 반복하지 말고 오류 원인을 분석해 한 번 수정한 뒤 다시 실행한다.

---

# 13. 최종 보고

최종 답변은 짧게 작성한다.

다음 항목만 보고한다.

## 완료 결과

```text
구현: 성공 / 부분 성공 / 실패
육임 테스트: 통과 / 일부 불일치
프로덕션 빌드: 성공 / 실패
.ait 생성: 성공 / 실패
Supabase 사용: 사용 / 미사용
```

## 주요 변경 파일

핵심 파일만 나열한다.

## Supabase 생성 객체

Supabase를 사용한 경우 생성한 `ora_` 객체만 나열한다.

## 사용자가 설정할 값

* appName
* 광고 그룹 ID
* Supabase 환경변수
* AI API 환경변수
* 앱 아이콘

## 남은 문제

출시를 막는 문제만 작성한다.

---

# 14. 실행 원칙

* 사소한 구현 판단은 질문하지 말고 진행한다.
* 원본 프로젝트 수정이 필요한 경우 진행하지 않는다.
* 데이터 삭제가 필요한 경우 진행하지 않는다.
* 운영 DB 변경이 필요한 경우 SQL만 작성한다.
* 비밀키가 필요한 경우 placeholder를 사용한다.
* MVP 범위를 넘어서는 기능은 구현하지 않는다.
* 장문의 설명보다 실제 동작하는 코드를 우선한다.
* 이미 성공한 검증 명령을 반복하지 않는다.
* 완료되지 않은 기능을 완료라고 보고하지 않는다.

이제 지정된 경로를 확인하고 분석부터 구현, 테스트, `.ait` 생성까지 순서대로 진행하라.
