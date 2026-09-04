# @last-spark/mobile

Last Spark 모바일 앱 — React Native + Expo. 기획서 9.1(클라이언트 스택) 기준 **동작하는 스타터**입니다.

## 로컬 실행

```bash
# 루트에서
pnpm install

# 백엔드(apps/server)를 먼저 띄워야 라운지/제단 기능이 동작합니다
pnpm run server

# 다른 터미널에서
pnpm run mobile
```

Expo Go 앱으로 QR을 스캔하거나 시뮬레이터로 열면 됩니다. 실기기에서 테스트할 땐 `app.json`의 `extra.socketServerUrl`을 로컬 IP(`http://192.168.x.x:4000`)로 바꿔야 합니다 — `localhost`는 실기기에서 자기 자신을 가리켜 서버에 닿지 않습니다.

> pnpm 모노레포라 `metro.config.js`에 심볼릭 링크 해석 설정이 들어있습니다(Metro가 기본적으로 pnpm의 심볼릭 링크 node_modules를 못 따라가서 필요). 이 파일을 지우면 `Unable to resolve module` 에러가 납니다.

## 구조 — FSD(Feature-Sliced Design) 라이트

```
app/                Expo Router 진입점(라우팅 전용, 얇게 유지)
src/
  app/              Provider, StateMachineRoot(상태머신이 곧 네비게이션)
  screens/          A~E 상태별 화면(pages 레이어)
  widgets/          여러 feature/entity를 조합한 UI 블록
  features/         사용자 액션 단위(배터리 추적, 라운지 매칭, 비상 카운트다운, 제단, 공유카드, 상점, 광고)
  entities/         도메인 모델(player, room, gravestone)
  shared/           ui 키트, api(소켓 클라이언트), i18n, theme, config
```

**의존 방향 규칙**(FSD 표준): `screens → widgets → features → entities → shared` 방향으로만 import한다. 역방향 import(예: `shared`가 `features`를 import)는 금지. `apps/mobile/CLAUDE.md`에 더 자세히 정리되어 있습니다.

## 지금 이 스캐폴드가 하는 일 / 하지 않는 일

**동작함**
- 상태머신 A~E 전체 전이 (`@last-spark/shared`의 `evaluateNextState` 사용, `src/features/battery-tracking`)
- 실기기 배터리 센서 연동(`expo-battery`) + `__DEV__` 전용 수동 오버라이드 슬라이더
- 소켓 클라이언트 연결/이벤트 배선 (입장, 이동 동기화, 비상 카운트다운, 제단 유언)
- i18n(ko/en/ja/es) — `expo-localization`으로 기기 언어 자동 감지
- DESIGN.md 기반 다크 테마 디자인 토큰 및 기본 UI 키트(Button/Card/AppText)

**아직 안 함 (TODO — `docs/실행체크리스트.md` 참고)**
- 실제 배경/캐릭터 최종 아트(Higgsfield) — 지금 `assets/`의 배경·캐릭터는 기획서 2.1.1 팔레트로 스크립트 생성한 자리표시자
- RevenueCat(IAP), AdMob(보상형 광고), Sentry, Amplitude 등 — 계정/콘솔 설정 이후 연동
- 근접 채팅, 리액션, 건배 등 라운지 내 세부 인터랙션(4.2-B)
- 푸시 알림(`expo-notifications`) 배선
