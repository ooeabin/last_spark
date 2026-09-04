# 마지막 불꽃 (Last Spark)

배터리 잔량 10% 이하에서만 입장 가능한, 국가별로 매칭되는 2D(손그림 룸 배경 + 통통한 SD 동물 캐릭터, 큐트-흑화 카툰 스타일) 메타버스 시한부 라운지.

이 파일은 Cursor·Codex 등 `AGENTS.md`를 읽는 에이전트 툴이 항상 참고하는 요약 가이드다. 더 깊이 필요하면:
- `docs/기획서.md` — 기획 원본 (기능 추가/변경 시 먼저 확인)
- `.claude/skills/last-spark-domain/SKILL.md` — 상태머신/소켓 계약/DB/UI 컴포넌트/커밋 규칙 등 도메인 규칙 전체 (이 파일의 내용과 거의 동일하지만 더 상세함 — Claude Code용으로 만든 문서지만 다른 툴에서 작업할 때도 그대로 유효)
- `apps/mobile/CLAUDE.md`, `apps/server/CLAUDE.md` — 앱별 컨벤션

## 레포 구조

```
last-spark/
  docs/                          기획서·실행체크리스트·디자인 시스템 원본 (참고용, 코드 아님)
  packages/shared/                mobile↔server 공유 TS 타입·상수(상태머신·소켓 이벤트·엔티티) — 단일 소스
  apps/mobile/                    React Native + Expo 클라이언트 (FSD-lite: screens/widgets/features/entities/shared)
  apps/server/                    Fastify + Socket.io 백엔드 (config/sockets/rooms/routes/db/lib)
  .claude/skills/last-spark-domain/SKILL.md   도메인 규칙 (Claude Code 스킬, 내용은 도구 무관)
  AGENTS.md                       이 파일
```

패키지 매니저는 **pnpm**(workspace:* 프로토콜, `pnpm-workspace.yaml`). `pnpm install` → `pnpm run server` / `pnpm run mobile`.

## 상태머신이 곧 앱의 뼈대다

`packages/shared/src/state-machine.ts`의 `evaluateNextState()`가 유일한 전이 로직 소스다. WAITING → LOUNGE → EMERGENCY / LAST_RITES → DEAD. mobile 스토어(`apps/mobile/src/features/battery-tracking/model/gameStateStore.ts`)나 서버 룸 로직에 전이 조건을 다시 구현하지 말 것 — 항상 이 함수를 통해서만 판정한다.

단, WAITING → LOUNGE만은 조건 충족만으로 전이하지 않는다 — 대기 화면에서 유저가 입장 버튼을 눌러야(`entryRequested`) 넘어간다. "지금 입장할 수 있는가"만 묻는 UI는 같은 파일의 `canEnterLounge()`를 쓴다.

## 소켓 이벤트 · 공유 상수는 packages/shared가 기준

`packages/shared/src/socket-events.ts`에 클라이언트-서버 이벤트 타입이 전부 있다. 새 이벤트 추가 순서: shared 타입 → 서버 핸들러(`apps/server/src/sockets/`) → 클라이언트 훅(`apps/mobile/src/features/`). C→S 요청과 S→C 결과는 별개 이벤트로 나눈다(`altar:submit`→`altar:broadcast` 등) — 서버가 검증한 뒤 뿌려야 하기 때문이다. 클라이언트·서버 양쪽이 똑같이 지켜야 하는 숫자 제약(예: 유언 30자 제한 `MAX_ALTAR_MESSAGE_LENGTH`)도 로컬 상수로 중복 정의하지 말고 `packages/shared/src/entities.ts`에서 가져다 쓴다.

## UI는 shared/ui + tokens.ts가 기준

텍스트는 `AppText`, 버튼은 `Button`, 카드는 `Card`, 화면 래퍼는 `ScreenContainer`(전부 `apps/mobile/src/shared/ui`) 재사용이 우선이다. 색은 `apps/mobile/src/shared/theme/tokens.ts`의 값만 쓰고 컴포넌트에 HEX를 직접 박지 않는다. 자세한 규칙은 SKILL.md "UI 컴포넌트 규칙"/"색상 규칙" 참고.

## 지키면 안 되는 방향 전환

- **아트 디렉션은 3D가 아니라 2D, 픽셀 아트도 아니다**(큐트-흑화 카툰: 정적/패럴랙스 손그림 룸 배경 + 통통한 SD 동물 캐릭터, 고정 시점, 기획서 2.1.1 고정 팔레트 6색). react-three-fiber 같은 3D 스택은 엔지니어링 비용 때문에 채택하지 않는다 — 다시 제안하기 전에 `docs/기획서.md` 2.1.1과 SKILL.md "아트 디렉션 — 3D 아님, 픽셀 아트도 아님" 절부터 확인할 것.
- **룸 매칭은 국가별로 분리, 비주얼 테마는 전 국가 통일.** 이 둘을 섞어서 "단일 글로벌 룸"으로 되돌리지 말 것.

## 문서는 현재 사양만 적는다

제품 동작(상태머신 전이·화면 흐름·진입 조건·소켓 이벤트 등)이 바뀌면 `docs/기획서.md`를 반드시 같이 고친다 — 기획서 → SKILL.md/AGENTS.md → 코드 순. 그리고 "원래는 X였는데 바꿨다" 같은 변경 이력은 문서·README·코드 주석 어디에도 남기지 않는다(이력은 git에 있다). "왜 이렇게 되어 있는가"는 과거 사건이 아니라 현재의 인과로 쓴다.

## 커밋 메시지

```
<type> : <subject>
```
type은 `feat`/`fix`/`refactor`/`style`/`chore`/`docs`/`test`(소문자), subject는 한글·마침표 없음. 예: `feat : 커리어카드 폼 Dialog fullscreen variant 추가`

## 지금 아직 없는 것

테스트 프레임워크·린트·포맷터가 아직 설정되어 있지 않다. 코드 작성 후 `pnpm run typecheck` 통과만 필수이고, 테스트/린트 도입은 사용자와 먼저 논의한다.
