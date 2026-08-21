# apps/mobile — 클라이언트 가이드

React Native + Expo. 구조는 FSD(Feature-Sliced Design)를 라이트하게 적용했다 — 엄격한 FSD 툴링(ESLint 플러그인, 세그먼트 강제)까지는 안 쓰지만 레이어 개념과 의존 방향 규칙은 지킨다.

## 레이어와 의존 방향

```
app/(Expo Router, 얇게)
src/
  app/        Provider, StateMachineRoot — 전역 부트스트랩
  screens/    A~E 상태별 화면 (pages 레이어)
  widgets/    여러 feature/entity를 조합한 UI 블록
  features/   사용자 액션 단위 — 이 레포의 실질적인 로직 대부분이 여기
  entities/   도메인 모델 (player, room, gravestone) — 순수 데이터/유틸
  shared/     ui 키트, api, i18n, theme, config — 프로젝트 도메인 지식 없음
```

**규칙**: 위에서 아래로만 import한다 (`screens → widgets → features → entities → shared`). `shared`는 `features`를 모르고, `entities`는 `features`를 모른다. 예외를 두고 싶으면(예: feature 간 직접 참조가 꼭 필요한 경우) 먼저 widgets나 screens로 끌어올릴 수 없는지 검토한다.

새 기능을 추가할 때:
1. 서버와 통신이 필요한가? → `packages/shared/src/socket-events.ts`에 타입부터 추가
2. 상태 관리가 필요한가? → 기존 `features/battery-tracking/model/gameStateStore.ts`에 붙일지, 새 feature 폴더에 자체 zustand store를 둘지 판단 (상태머신 자체와 무관하면 새 feature로 분리)
3. UI가 화면 하나에 종속되면 `screens/<screen>/`에 바로, 여러 화면에서 재사용되면 `widgets/`로

## 상태머신은 네비게이션이다

`src/app/StateMachineRoot.tsx`가 `gameState`(WAITING/LOUNGE/EMERGENCY/LAST_RITES/DEAD)를 보고 화면을 직접 스위칭한다. Expo Router 스택 네비게이션을 쓰지 않는 이유는, 유저가 임의로 화면을 오가는 게 아니라 배터리/충전 상태가 화면을 강제로 결정하는 앱이라서다. 새 화면이 필요해도(예: 설정, 프로필) 상태머신에 없는 화면이면 Expo Router의 별도 라우트로 추가하고, 상태머신에 연동되는 화면만 `StateMachineRoot`에 붙인다.

## 디자인 시스템

`src/shared/theme/tokens.ts`가 `docs/DESIGN.md`(Spotify 스타일 다크 디자인 시스템)를 이 프로젝트에 맞게 옮긴 것이다. 근흑 배경 단계(`background`/`surface`/`surfaceAlt`), 단일 기능색(`accent`), 알약/원형 버튼, 두꺼운 그림자, 콤팩트한 타이포 스케일 — 구조는 DESIGN.md 그대로고 색상값(`accent`)만 사이버펑크 톤 placeholder로 바꿨다. 기획서 9.4 "아트 디렉션 고정" 단계에서 실제 팔레트(5~6색)가 확정되면 `tokens.ts`의 `colors.accent`/`colors.accentBorder`만 바꾸면 된다 — 컴포넌트 코드는 손댈 필요 없음.

새 UI를 만들 때는 색상 하드코딩 대신 `@/shared/theme/tokens`의 값을 쓰고, 텍스트는 `AppText`, 버튼은 `Button`(primary/pill/outline/circular variant) 등 `@/shared/ui`의 공통 컴포넌트를 우선 재사용한다. 강제 규칙(허용된 variant/토큰 목록, HEX 리터럴 금지 등)의 상세는 `.claude/skills/last-spark-domain/SKILL.md`의 "UI 컴포넌트 규칙"·"색상 규칙" 절 참고.

## 배터리/실기기 관련 주의

- `useRealBatteryTracking`(`src/features/battery-tracking`)이 앱 루트(`StateMachineRoot`)에서 항상 실행되며 `expo-battery` 실측값으로 스토어를 갱신한다
- `__DEV__` 빌드에서만 `DevBatteryControls`가 렌더링되어 수동으로 배터리/충전 상태를 조작할 수 있다 — 시뮬레이터에는 배터리 센서가 없어서 필수
- 제단(altar) 화면에 있는 동안은 `gameStateStore.altarOpen`이 true라 배터리 변화가 와도 상태 전이가 보류된다 — 웹 프로토타입 개발 중 "유언 작성 도중 방전으로 내용이 날아가는" 레이스 컨디션을 겪은 적이 있어서 넣은 안전장치다. 이 플래그를 건드리는 코드를 새로 짤 땐 이 이유를 기억할 것.

## 실행

```bash
pnpm run server   # 루트에서 — 먼저 백엔드를 띄워야 소켓 연결이 됨
pnpm run mobile
```
