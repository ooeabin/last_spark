---
name: last-spark-domain
description: 마지막 불꽃(Last Spark) 앱의 도메인 규칙 — 상태머신, 소켓 이벤트 계약, 공유 상수, UI 컴포넌트·색상·상태관리·접근성 규칙, DB 스키마, 룸/테마 정책, 수익화, 에셋 파이프라인, 라이브러리·테스트 규칙, 커밋 규칙. 이 레포에서 게임 로직·소켓 핸들러·화면·디자인 시스템을 구현하거나 수정할 때 참고한다.
---

# 마지막 불꽃 — 도메인 규칙

기획 원본은 `docs/기획서.md`다. 이 스킬은 그 기획서에서 "코드를 짤 때 틀리기 쉬운 지점"만 뽑아 규칙화한 것이지, 기획서를 대체하지 않는다.

## 문서는 현재 사양만 적는다

**제품 동작이 바뀌면 `docs/기획서.md`를 반드시 같이 고친다.** 상태머신 전이, 화면 흐름, 진입 조건, 소켓 이벤트 계약처럼 기획에 해당하는 것을 코드에서 바꿔놓고 기획서를 그대로 두면 기획서가 거짓이 된다. 순서는 기획서 → 이 스킬(및 `AGENTS.md` 요약) → 코드다.

**변경 이력은 문서에 남기지 않는다.** "원래는 X였는데 Y로 바꿨다", "기획서 원표에는 없지만 구현에서 보충했다", "2026-08 버그 수정과 함께 분리" 같은 로그성 서술을 문서·README·코드 주석 어디에도 쓰지 않는다. 이력은 git이 이미 갖고 있고, 문서에 중복해 쌓이면 "기획서와 구현의 차이" 같은 군더더기 절이 계속 늘어난다.

대신 **"왜 이렇게 되어 있는가"(설계 의도)는 현재형으로 남긴다.** 지우면 같은 실수를 반복하게 되는 정보이기 때문이다 — 다만 과거 사건이 아니라 지금의 인과로 쓴다.

- ❌ `웹 프로토타입에서 유언이 날아가는 버그를 겪어서 넣은 플래그다`
- ✅ `이게 없으면 작성 도중 방전 전이가 일어나 입력하던 유언이 사라진다`

## 상태머신 (A~E)

단일 소스: `packages/shared/src/state-machine.ts`의 `evaluateNextState()`. 이 함수 밖에서 전이 조건을 다시 구현하지 않는다.

| 상태 | 진입 조건 | 핵심 동작 |
|---|---|---|
| WAITING | 배터리 > 10% 또는 충전 중 (+ 아직 입장하지 않은 상태) | 내 캐릭터 표시, 입장 가능 여부 안내, 묘비 갤러리, 전광판, 10% 도달 푸시 예약 |
| LOUNGE | 배터리 ≤10% AND 미충전 AND 유저가 입장을 누름 | 국가별 라운지 자동 매칭, 룸당 30명 |
| EMERGENCY | 라운지 중 충전 감지 | 10초 카운트다운, 미분리 시 강제 퇴장 |
| LAST_RITES | 배터리 1% | 제단 접근, 유언 브로드캐스트, 광고로 3분 유예 |
| DEAD | 배터리 0% 또는 종료 | 묘비 생성, 유언 영구 저장 |

스타터 구현의 단순화: 기획서는 "1%에서 제단 접근 *권한*이 열린다"는 정도로만 서술하지만, 코드에서는 배터리 1%가 되는 즉시 LOUNGE→LAST_RITES로 화면 자체를 전환한다. 나중에 "제단은 선택적으로만 들어간다"는 식으로 바꾸고 싶으면 `evaluateNextState`의 LOUNGE 분기만 고치면 된다.

**WAITING→LOUNGE는 자동이 아니다.** 조건(≤10% & 미충전)을 만족해도 전이하지 않고, `entryRequested`가 함께 들어와야 넘어간다 — 대기 화면이 "입장 가능"을 보여주고 유저가 입장 버튼을 눌렀을 때만이다(기획서 4.1). 조건만 묻는 UI는 같은 파일의 `canEnterLounge(batteryLevel, isCharging)`를 쓴다 — 조건을 화면에서 다시 쓰지 않는다.

## 소켓 이벤트 계약

단일 소스: `packages/shared/src/socket-events.ts` (기획서 5.2). 새 이벤트가 필요하면 여기부터 타입을 추가하고 서버 핸들러 → 클라이언트 훅 순서로 배선한다.

**요청과 결과는 별개 이벤트로 나눈다.** 클라이언트가 보낸 값은 서버가 검증한 뒤 뿌려야 하므로, C→S 요청과 S→C 결과를 한 이벤트로 합치지 않는다:

- `lounge:join` (C→S) → `lounge:joined` (S→C): 입장 요청과 룸 배정 결과
- `altar:submit` (C→S) → `altar:broadcast` (S→C): 유언 작성 요청과, 검증 후 전체 송출
- `emergency:detach` (C→S) → `emergency:cancel` (S→C): 충전기 분리 신호와, 생존 확정 브로드캐스트

`presence:update` (S→C)는 룸 인원수 변경 알림이다 — 입장 UI에 "17/30명" 같은 표시를 하려면 필요하다.

## 공유 상수 규칙

클라이언트와 서버가 **똑같은 값을 지켜야 하는 숫자·문자열 제약**은 각자 로컬 상수로 중복 정의하지 말고 `packages/shared/src/entities.ts`(또는 관련 파일)에 export된 상수 하나로 통일한다. 예: 1% 제단 유언 최대 길이는 `MAX_ALTAR_MESSAGE_LENGTH`로 정의되어 있고, `apps/mobile/src/features/altar-broadcast/model/useAltar.ts`와 `apps/server/src/sockets/altar.handlers.ts` 양쪽이 이 값을 import해서 쓴다. 각자 `30`을 하드코딩하면 값을 바꿀 때 두 군데를 같이 고쳐야 하고, 한쪽을 놓치면 클라이언트에서는 통과한 유언이 서버에서 잘리는 식으로 어긋난다.

새로 이런 제약값(닉네임 길이, 룸 정원 등)이 생기면 먼저 `packages/shared`에 상수로 추가하고, 클라이언트·서버 둘 다 거기서 import해서 쓴다.

## 룸/테마 정책 (기획서 3장) — 헷갈리기 쉬운 지점

**룸 매칭은 국가별로 분리하되, 비주얼 테마는 전 국가 통일이다.** 이 두 개를 섞지 말 것:

- 매칭(어느 유저가 같은 룸에 들어가는가) = 국가 코드 기준 분리 (`roomManager.assignRoom(countryCode)`)
- 테마(룸이 어떻게 생겼는가) = 전 국가 공통 "잿불 바"(어스름한 오두막 라운지) 1종

매칭은 항상 국가별로 유지한다 — 타임존으로 룸을 나누지 않는다는 것이지, 매칭을 전역 단일 풀로 합친다는 뜻이 아니다. 정원 30명 초과 시 같은 국가 안에서 `KR-2`, `KR-3`처럼 분점을 만든다(`roomManager.ts`). 사용자 수가 적은 국가는 `GL` 버킷.

V2에서 국가별 테마를 분리하고 싶다면 기획서 3.2의 3개국(KR/US/JP) 테마 초안을 참고한다.

## 아트 디렉션 — 3D 아님, 픽셀 아트도 아님

스타일은 **큐트-흑화 카툰**(기획서 2.1.1)이다 — 두꺼운 잉크 아웃라인의 통통한 SD 동물 캐릭터 + 손그림 실내 룸 배경(동물 카페류 게임 참고)에, 채도 낮춘 황혼 팔레트와 잿불·촛불 조명으로 "귀엽지만 스러져 가는" 톤을 얹는다. 모든 에셋 색은 기획서 2.1.1의 고정 팔레트 6색에서 파생시킨다. 픽셀(도트) 아트가 아니므로 스프라이트 확대는 Nearest가 아니라 Linear 샘플링을 쓴다.

배경은 실시간 3D가 아니라 **2D 이미지 레이어 + 고정 시점**이고, 라운지는 화면보다 넓은 고정 크기 월드(`features/free-roam/model/constants.ts`의 `WORLD_WIDTH/HEIGHT`) 위를 어몽어스식 추적 카메라가 스크롤한다 — 위치 동기화 정규화(0~1)의 기준도 화면이 아니라 이 월드 크기다. react-three-fiber/expo-three 같은 3D 렌더링 스택은 이 프로젝트에 없다 — `react-native-skia` 기반 2D 합성 렌더링만 쓴다. HD-2D(실시간 3D 씬 + 자유/추적 카메라)는 엔지니어링 비용 때문에 채택하지 않기로 한 방식이므로, 3D 관련 코드나 의존성을 추가하자는 제안이 나오면 이 결정을 먼저 확인할 것.

## UI 컴포넌트 규칙

**사용자에게 보이는 UI는 `apps/mobile/src/shared/ui`의 공통 컴포넌트로만 조립한다.** raw `<Text>`/`<Pressable>`/`<View>`를 직접 스타일링해서 화면마다 새로 만들지 않는다(레이아웃 전용 `<View>` 래핑은 예외).

- **텍스트**: `AppText` 컴포넌트만 사용한다. `variant` prop으로 크기·굵기를 지정한다 — `sectionTitle` · `featureHeading` · `bodyBold` · `body`(기본값) · `buttonUppercase` · `caption` · `captionBold` · `small` · `smallBold` · `micro` (전부 `apps/mobile/src/shared/theme/tokens.ts`의 `typography`에 정의됨). 필요한 크기/굵기 조합이 없다고 `style` prop으로 `fontSize`/`fontWeight`를 직접 덧대지 않는다 — 정말 없으면 `tokens.ts`의 `typography`에 옵션을 추가하도록 사용자에게 먼저 확인한다.
- **버튼**: `Button` 컴포넌트만 사용한다(`label` prop, 네이티브 `<button>`이나 직접 스타일링한 `<Pressable>` 금지). `variant`는 `primary` · `primaryLarge` · `pill`(기본값) · `outline` · `circular` 5종. 크기·형태 변경은 `variant`로만 하고, 새 형태가 필요하면 `Button.tsx`에 variant를 추가한다. 화면의 주 CTA(입장·제출·분리처럼 그 화면에서 해야 할 단 하나의 행동)는 `primaryLarge`를 써서 다른 버튼과 위계를 만든다 — 한 화면에 둘 이상 두지 않는다.
- **카드형 컨테이너**: `Card`(`elevated` prop으로 그림자 유무 조절).
- **화면 최상위 래퍼**: 각 화면(대기/라운지/비상/제단/사망)은 `ScreenContainer`로 감싼다 — SafeArea·배경색·기본 패딩이 여기서 일괄 처리된다.
- 새 공통 UI가 필요하면 먼저 `apps/mobile/src/shared/ui`에 이미 비슷한 게 있는지 확인하고, 없으면 거기에 추가한다(화면 하나에서만 쓰는 조합은 해당 화면/feature 안에 둬도 된다).

## 색상 규칙

**색은 반드시 `apps/mobile/src/shared/theme/tokens.ts`의 `colors` 값만 사용한다.** 컴포넌트에 HEX(`#00f0ff`)·`rgb()`·`rgba()` 리터럴을 직접 쓰지 않는다 — `AppText`의 `color` prop, 커스텀 `style`의 색상 값 전부 마찬가지다.

- 사용 가능한 토큰: `background`·`surface`·`surfaceAlt`·`card`·`cardAlt`(배경/표면), `textPrimary`·`textSecondary`·`textSecondaryBright`·`textEmphasis`(텍스트), `border`·`borderLight`·`separator`(테두리), `negative`·`warning`·`announcement`(상태색), `accent`·`accentBorder`(단일 기능색 — 기획서 2.1.1 고정 팔레트의 "도깨비불 민트", 캐릭터 머리 위 불꽃과 같은 색), `emergencyBackground`(비상 카운트다운 화면 전용 짙은 레드 배경 — 고정 팔레트의 "핏빛 레드"), `overlay`(이미지 위 텍스트 가독성용 반투명 스크림).
- 필요한 색이 토큰에 없으면 리터럴을 바로 쓰지 말고, 먼저 `tokens.ts`의 `colors`에 값을 추가한 뒤 그 토큰을 참조한다. 토큰 이름이 애매하면 사용자에게 먼저 확인한다. `emergencyBackground`도 이 절차대로 추가된 것 — `EmergencyScreen.tsx`에 `backgroundColor: "#2a0d10"`로 하드코딩돼 있던 걸 토큰화했다.
- `accent`/`accentBorder` 값은 기획서 2.1.1 고정 팔레트를 따른다 — 팔레트를 바꾸고 싶으면 기획서 2.1.1부터 고치고 `tokens.ts`의 토큰 값만 바꾼다. 컴포넌트 코드에 이 값을 다시 하드코딩하지 않는다.
- 참고: 화면 컴포넌트 6개(`DeathScreen`·`AltarScreen`·`LoungeScreen`·`WaitingScreen`·`GravestoneGallery` 등)에 `color="#b3b3b3"`/`"#7c7c7c"`처럼 HEX가 직접 박혀 있던 걸 각각 `colors.textSecondary`/`colors.borderLight`로 고친 적이 있다 — 디자인 목업에서 눈대중으로 HEX를 그대로 옮기는 패턴을 반복하지 말 것.

## 상태 관리 규칙

- 전역 상태는 `zustand`를 사용한다. 스토어 파일은 해당 feature의 `model/` 폴더에 둔다 — 예: `apps/mobile/src/features/battery-tracking/model/gameStateStore.ts`.
- 상태머신(gameState) 관련 값은 새 스토어를 만들지 않고 기존 `gameStateStore`에 붙인다. 상태머신과 무관한 새 기능이면 해당 feature 폴더에 자체 zustand 스토어를 새로 둔다.
- 서버에서 온 데이터(소켓 이벤트 payload, REST 응답)를 캐싱·동기화하는 목적으로는 zustand를 쓰지 않는다 — 소켓 이벤트는 훅(`features/*/model/use*.ts`)이 직접 구독해서 로컬 `useState`로 반영하는 현재 패턴(`useAltar`, `useEmergencyCountdown` 등)을 따른다.
- 탭 같은 화면 내 전환 상태는 (아직 이 프로젝트엔 탭 UI가 없지만, 생기면) URL/쿼리보다 상태머신이 우선이다 — 상태머신이 이미 네비게이션 역할을 하고 있으므로(`apps/mobile/CLAUDE.md` 참고) 별도 상태 동기화 레이어를 새로 만들기 전에 먼저 확인한다.

## 접근성 규칙

- 아이콘만 있고 텍스트 라벨이 없는 `Button`/`Pressable`에는 반드시 `accessibilityLabel`을 지정한다(예: `circular` variant 버튼).
- 터치 가능 영역은 최소 44x44pt를 확보한다 — `circular` variant(48x48)는 이미 만족하지만, 새 터치 요소를 만들 때 이 기준 아래로 줄이지 않는다.
- `View`를 클릭 영역으로 쓰는 경우는 없어야 한다(`Button`을 쓸 것) — 부득이하게 필요하면 `accessibilityRole="button"`과 `accessibilityLabel`을 함께 지정한다.

## 미구현 기능 표시 규칙

아직 실제로 연동되지 않은 기능(결제, 광고 SDK 등)은 **조용히 숨기지 않고, 사용자에게 "준비 중"임을 명확히 보여준다.** 이미 이 패턴을 쓰고 있는 두 예시를 기준으로 삼는다:

- **버튼 비활성화 + 안내 라벨**: `ShopList.tsx`의 구매 버튼은 `disabled` + `label="구매 (준비중)"`로 렌더된다. 실제 결제 로직이 없다고 버튼을 아예 안 그리거나 조용히 무시하게 만들지 않는다.
- **스텁 + TODO 주석**: `useRewardedAd.ts`처럼 실제 SDK 연동 전까지는 동작을 시뮬레이션하는 스텁을 두고, 파일 상단에 `TODO: <SDK명> 연동 (실행체크리스트 N단계, ...)` 형식으로 무엇이 남았는지 명시한다.

새 기능을 추가할 때 백엔드/SDK가 아직 없다면 이 두 패턴 중 상황에 맞는 쪽을 따른다 — 목업 데이터를 화면에 하드코딩해서 "동작하는 것처럼" 보이게 만들지 않는다(데이터 자체가 없으면 빈 상태 UI 또는 위 패턴으로 처리).

## 에셋 파이프라인 (기획서 9.4)

전속 디자이너 없이 진행한다. 배경·캐릭터 모두 Higgsfield `generate_image`로 뽑는다(배경은 패럴랙스면 레이어별로 나눠 생성, 캐릭터는 프레임 시트 생성 + remove_background — 손그림 카툰 스타일이라 픽셀 특화 도구가 필요 없다). 최종 아트가 생기기 전까지 `apps/mobile/assets/`의 배경·캐릭터는 자리표시자다 — 교체할 때는 각 폴더 `CREDITS.md`에 적힌 규격(레이어 구성, 프레임 크기·수)만 맞추면 코드 수정 없이 파일 교체로 끝난다.

## DB 스키마 (기획서 5.1)

`gravestones`(묘비/유언 아카이브), `user_inventory`(배신자 프리패스 보유 여부, 장착 묘비 스킨) 두 테이블뿐이다. `apps/server/prisma/schema.prisma`가 그대로 반영. 새 유저 데이터가 필요해지면(예: 로그인, 친구) 기획서에 없는 확장이므로 기획서부터 갱신하고 스키마를 추가한다.

## 수익화 (기획서 6장)

상품 4종은 `packages/shared/src/entities.ts`의 `SHOP_ITEMS`가 단일 소스다 — 가격이나 상품을 바꿀 땐 여기부터. 산소호흡기(보상형 광고)만 무료이고 나머지 3개는 IAP.

## 리스크 — 코드 작성 시 유념할 것 (기획서 8장)

- **배터리 API 정확도**: iOS는 포그라운드에서만 배터리를 읽는다. "10% 도달 즉시 알림" 같은 기능을 만들 때 백그라운드에서 실시간으로 안 될 수 있다는 걸 전제로 설계할 것.
- **부정사용**: 배터리 값을 클라이언트가 임의로 보낼 수 있다는 전제로, 서버 측 검증(`apps/server/src/lib/antiCheat.ts`)을 신뢰 경계로 삼는다. 클라이언트 값만 믿고 중요한 판정(사망 처리, 묘비 생성 등)을 하지 말 것.
- **스토어 심사**: 비상 카운트다운/처형 연출이 "충전을 방해하는 UX"로 오해받지 않도록, 실제 충전 자체는 막지 않는다는 걸 UI 문구에서 항상 명확히 할 것.
- **디지털 웰빙**: 과도한 재접속을 유도하는 패턴(예: 방전 대기를 게이미피케이션으로 더 부추기는 기능)은 추가하기 전에 한 번 더 생각할 것.

## 라이브러리 규칙

- `package.json`에 없는 새 의존성은 사용자 승인 없이 추가하지 않는다.
- 아이콘 라이브러리는 아직 도입되어 있지 않다 — 필요해지면 사용자와 먼저 논의하고 고른다(그 전까지 UI 아이콘은 기획서 9.4처럼 이모지 placeholder로 대체 가능).
- 애니메이션은 이미 설치된 `react-native-reanimated`/`react-native-gesture-handler`를 사용한다. 새 애니메이션 라이브러리를 추가로 도입하지 않는다.

## 테스트·린트·포맷 규칙

**테스트 프레임워크·ESLint·Prettier가 아직 이 레포에 설정되어 있지 않다** (실제 없는 도구를 있는 것처럼 규칙화하지 않기 위해 명시해둔다). 지금 유일하게 강제되는 검증은 타입체크뿐이다:

```bash
pnpm run typecheck   # shared → server → mobile 순서로 tsc --noEmit
```

코드 작성 후 이 명령이 통과하는지 확인한다. 테스트·린트·포맷터 도입은 이 스킬을 임의로 갱신해 규칙화하지 말고, 먼저 사용자와 어떤 도구·컨벤션을 쓸지 논의한 뒤 진행한다.

## 커밋 메시지 규칙

```
<type> : <subject>
```

- type: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, `test` (소문자)
- subject: 한글, 마침표 없음
- 예: `feat : 커리어카드 폼 Dialog fullscreen variant 추가`

## 지원 언어

ko/en/ja/es 4개 고정(`packages/shared/src/i18n.ts`). 새 문자열은 4개 로케일 파일(`apps/mobile/src/shared/i18n/locales/*.json`)에 전부 추가해야 하고, 하나라도 빠지면 `fallbackLng`("en")로 대체되긴 하지만 리뷰에서 놓치기 쉬우니 PR에서 항상 4개 파일 diff를 같이 확인할 것.
