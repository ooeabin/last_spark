---
name: last-spark-domain
description: 마지막 불꽃(Last Spark) 앱의 도메인 규칙 — 상태머신, 소켓 이벤트 계약, 공유 상수, UI 컴포넌트·색상·상태관리·접근성 규칙, DB 스키마, 룸/테마 정책, 수익화, 에셋 파이프라인, 라이브러리·테스트 규칙, 커밋 규칙. 이 레포에서 게임 로직·소켓 핸들러·화면·디자인 시스템을 구현하거나 수정할 때 참고한다.
---

# 마지막 불꽃 — 도메인 규칙

기획 원본은 `docs/기획서.md`다. 이 스킬은 그 기획서에서 "코드를 짤 때 틀리기 쉬운 지점"만 뽑아 규칙화한 것이지, 기획서를 대체하지 않는다. 기획 자체가 바뀌면 기획서를 먼저 고치고 이 스킬을 따라 갱신한다.

## 상태머신 (A~E)

단일 소스: `packages/shared/src/state-machine.ts`의 `evaluateNextState()`. 이 함수 밖에서 전이 조건을 다시 구현하지 않는다.

| 상태 | 진입 조건 | 핵심 동작 |
|---|---|---|
| WAITING | 배터리 > 10% 또는 충전 중 | 묘비 갤러리, 전광판, 10% 도달 푸시 예약 |
| LOUNGE | 배터리 ≤10% AND 미충전 | 국가별 라운지 자동 매칭, 룸당 30명 |
| EMERGENCY | 라운지 중 충전 감지 | 10초 카운트다운, 미분리 시 강제 퇴장 |
| LAST_RITES | 배터리 1% | 제단 접근, 유언 브로드캐스트, 광고로 3분 유예 |
| DEAD | 배터리 0% 또는 종료 | 묘비 생성, 유언 영구 저장 |

스타터 구현의 단순화: 기획서는 "1%에서 제단 접근 *권한*이 열린다"는 정도로만 서술하지만, 코드에서는 배터리 1%가 되는 즉시 LOUNGE→LAST_RITES로 화면 자체를 전환한다. 나중에 "제단은 선택적으로만 들어간다"는 식으로 바꾸고 싶으면 `evaluateNextState`의 LOUNGE 분기만 고치면 된다.

## 소켓 이벤트 계약

단일 소스: `packages/shared/src/socket-events.ts`. 기획서 5.2 원표의 7개 이벤트(`lounge:join`, `player:sync_move`, `battery:change`, `emergency:start`, `emergency:cancel`, `traitor:execute`, `altar:broadcast`)에 더해, 구현하면서 4개를 보충했다 — 원표는 왕복(요청→응답) 관계까지는 명시하지 않았기 때문:

- `lounge:joined` (S→C): 입장 요청에 대한 서버 확인 응답(룸 배정 결과)
- `altar:submit` (C→S): 유언 "작성"과 "브로드캐스트"는 다른 이벤트다 — 클라이언트가 보내는 건 submit, 서버가 검증 후 전체에 뿌리는 게 원표의 `altar:broadcast`
- `emergency:detach` (C→S): 충전기 분리(생존) 신호. 원표엔 이 신호 자체가 없고 결과 이벤트(`emergency:cancel`)만 있었음
- `presence:update` (S→C): 룸 인원수 변경 알림(입장 UI에 "17/30명" 같은 표시를 하려면 필요)

새 이벤트가 필요하면 여기부터 타입을 추가하고 서버 핸들러 → 클라이언트 훅 순서로 배선한다.

## 공유 상수 규칙

클라이언트와 서버가 **똑같은 값을 지켜야 하는 숫자·문자열 제약**은 각자 로컬 상수로 중복 정의하지 말고 `packages/shared/src/entities.ts`(또는 관련 파일)에 export된 상수 하나로 통일한다. 예: 1% 제단 유언 최대 길이는 `MAX_ALTAR_MESSAGE_LENGTH`로 정의되어 있고, `apps/mobile/src/features/altar-broadcast/model/useAltar.ts`와 `apps/server/src/sockets/altar.handlers.ts` 양쪽이 이 값을 import해서 쓴다 — 예전엔 두 파일에 `30`이 각각 하드코딩돼 있어서 값을 바꾸려면 두 군데를 같이 고쳐야 했다(놓치기 쉬운 지점이었음).

새로 이런 제약값(닉네임 길이, 룸 정원 등)이 생기면 먼저 `packages/shared`에 상수로 추가하고, 클라이언트·서버 둘 다 거기서 import해서 쓴다.

## 룸/테마 정책 (기획서 3장) — 헷갈리기 쉬운 지점

**룸 매칭은 국가별로 분리하되, 비주얼 테마는 전 국가 통일이다.** 이 두 개를 섞지 말 것:

- 매칭(어느 유저가 같은 룸에 들어가는가) = 국가 코드 기준 분리 (`roomManager.assignRoom(countryCode)`)
- 테마(룸이 어떻게 생겼는가) = 전 국가 공통 "사이버펑크 폐허 바" 1종

과거 "타임존별 룸 분리하지 말자"는 지시를 "매칭까지 전역 단일 풀로 합치자"로 잘못 해석했다가 정정된 이력이 있다. 매칭은 항상 국가별로 유지한다. 정원 30명 초과 시 같은 국가 안에서 `KR-2`, `KR-3`처럼 분점을 만든다(`roomManager.ts`). 사용자 수가 적은 국가는 `GL` 버킷.

V2에서 국가별 테마를 분리하고 싶다면 기획서 3.2에 원래 3개국(KR/US/JP) 테마 초안이 남아있다.

## 아트 디렉션 — 3D 아님

배경은 실시간 3D가 아니라 **2D 이미지(필요시 원경/중경/근경 패럴랙스 레이어) + 고정 시점**이다(데이브 더 다이브 스타일, 기획서 2.1.1). react-three-fiber/expo-three 같은 3D 렌더링 스택은 이 프로젝트에 없다 — `react-native-skia` 기반 2D 합성 렌더링만 쓴다. 예전에 HD-2D(실시간 3D 씬 + 자유/추적 카메라)를 검토했다가 엔지니어링 비용 문제로 철회한 이력이 있으니, 3D 관련 코드나 의존성을 다시 추가하려는 제안이 나오면 이 결정을 먼저 확인할 것.

## UI 컴포넌트 규칙

**사용자에게 보이는 UI는 `apps/mobile/src/shared/ui`의 공통 컴포넌트로만 조립한다.** raw `<Text>`/`<Pressable>`/`<View>`를 직접 스타일링해서 화면마다 새로 만들지 않는다(레이아웃 전용 `<View>` 래핑은 예외).

- **텍스트**: `AppText` 컴포넌트만 사용한다. `variant` prop으로 크기·굵기를 지정한다 — `sectionTitle` · `featureHeading` · `bodyBold` · `body`(기본값) · `buttonUppercase` · `caption` · `captionBold` · `small` · `smallBold` · `micro` (전부 `apps/mobile/src/shared/theme/tokens.ts`의 `typography`에 정의됨). 필요한 크기/굵기 조합이 없다고 `style` prop으로 `fontSize`/`fontWeight`를 직접 덧대지 않는다 — 정말 없으면 `tokens.ts`의 `typography`에 옵션을 추가하도록 사용자에게 먼저 확인한다.
- **버튼**: `Button` 컴포넌트만 사용한다(`label` prop, 네이티브 `<button>`이나 직접 스타일링한 `<Pressable>` 금지). `variant`는 `primary` · `pill`(기본값) · `outline` · `circular` 4종. 크기·형태 변경은 `variant`로만 하고, 새 형태가 필요하면 `Button.tsx`에 variant를 추가한다.
- **카드형 컨테이너**: `Card`(`elevated` prop으로 그림자 유무 조절).
- **화면 최상위 래퍼**: 각 화면(대기/라운지/비상/제단/사망)은 `ScreenContainer`로 감싼다 — SafeArea·배경색·기본 패딩이 여기서 일괄 처리된다.
- 새 공통 UI가 필요하면 먼저 `apps/mobile/src/shared/ui`에 이미 비슷한 게 있는지 확인하고, 없으면 거기에 추가한다(화면 하나에서만 쓰는 조합은 해당 화면/feature 안에 둬도 된다).

## 색상 규칙

**색은 반드시 `apps/mobile/src/shared/theme/tokens.ts`의 `colors` 값만 사용한다.** 컴포넌트에 HEX(`#00f0ff`)·`rgb()`·`rgba()` 리터럴을 직접 쓰지 않는다 — `AppText`의 `color` prop, 커스텀 `style`의 색상 값 전부 마찬가지다.

- 사용 가능한 토큰: `background`·`surface`·`surfaceAlt`·`card`·`cardAlt`(배경/표면), `textPrimary`·`textSecondary`·`textSecondaryBright`·`textEmphasis`(텍스트), `border`·`borderLight`·`separator`(테두리), `negative`·`warning`·`announcement`(상태색), `accent`·`accentBorder`(단일 기능색 — 배터리 방전 임박, 라운지 사이버펑크 테마의 시안색 포인트), `emergencyBackground`(비상 카운트다운 화면 전용 짙은 레드 배경).
- 필요한 색이 토큰에 없으면 리터럴을 바로 쓰지 말고, 먼저 `tokens.ts`의 `colors`에 값을 추가한 뒤 그 토큰을 참조한다. 토큰 이름이 애매하면 사용자에게 먼저 확인한다. `emergencyBackground`도 이 절차대로 추가된 것 — `EmergencyScreen.tsx`에 `backgroundColor: "#2a0d10"`로 하드코딩돼 있던 걸 토큰화했다.
- `accent`는 현재 placeholder(기획서 9.4 "아트 디렉션 고정" 단계에서 실제 팔레트 확정 전)다 — 실제 팔레트가 나오면 `tokens.ts`의 `accent`/`accentBorder`만 바꾸면 되므로, 컴포넌트 코드에 이 값을 다시 하드코딩하지 않는다.
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

전속 디자이너 없이 진행한다. 배경은 Higgsfield `generate_image`(패럴랙스면 레이어별로 나눠 생성), 캐릭터 도트 스프라이트+애니메이션은 PixelLab. 실제 에셋이 생기기 전까지 `apps/mobile/src/screens/lounge/LoungeScreen.tsx`의 캔버스 자리는 placeholder Card로 남아있다 — 에셋 연동 시 이 부분을 `react-native-skia` Canvas로 교체.

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
