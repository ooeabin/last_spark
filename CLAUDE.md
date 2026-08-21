# 마지막 불꽃 (Last Spark) — 레포 가이드

배터리 잔량 10% 이하에서만 입장 가능한, 국가별로 매칭되는 2D(패럴랙스 배경 + 도트 캐릭터, 데이브 더 다이브 스타일) 메타버스 시한부 라운지. 상세 기획은 `docs/기획서.md`가 유일한 소스다 — 이 문서는 "레포를 어떻게 다루는가"만 다룬다.

## 이 문서를 읽는 순서

1. 이 파일(레포 전체 구조·명령어)
2. `.claude/skills/last-spark-domain/SKILL.md` — 상태머신/소켓 계약/DB 스키마 같은 도메인 규칙 (코드 작성 시 필수 참고)
3. `apps/mobile/CLAUDE.md`, `apps/server/CLAUDE.md` — 앱별 컨벤션
4. `docs/기획서.md` — 기획 원본 (기능 추가/변경 시 먼저 여기부터 확인)

Cursor·Codex 등 `AGENTS.md`를 읽는 툴로 이 레포를 열면 루트의 `AGENTS.md`가 2번 문서를 요약해서 자동으로 읽힌다 — 내용은 같은 소스에서 나온 것이므로 둘 중 아무거나 하나만 최신이면 다른 하나도 신뢰할 수 있다(단, 실제 갱신은 둘 다 손으로 맞춰야 한다 — 아래 "문서 구성 규칙" 참고).

## 레포 구조

```
last-spark/
  docs/                          기획서·실행체크리스트·디자인 시스템 원본 (참고용, 코드 아님)
  packages/shared/                mobile↔server 공유 TS 타입 (상태머신·소켓 이벤트·엔티티) — 단일 소스
  apps/mobile/                    React Native + Expo 클라이언트 (FSD-lite)
  apps/server/                    Fastify + Socket.io 백엔드
  .claude/skills/last-spark-domain/SKILL.md   도메인 규칙 스킬 (Claude Code)
  AGENTS.md                       같은 도메인 규칙 요약 (Cursor·Codex 등 범용)
  pnpm-workspace.yaml             pnpm 워크스페이스 정의 (apps/*, packages/*)
  .npmrc                          pnpm 설정 (peer dependency 관련)
```

패키지 매니저는 pnpm이다(모노레포 설치 속도·디스크 효율, 엄격한 의존성 격리 때문에 npm 대신 선택). `package.json`의 `packageManager` 필드가 버전을 고정하고 있으니, Corepack(`corepack enable`)을 쓰면 별도 설치 없이 그 버전이 자동으로 맞춰진다. 앱 간 참조는 `workspace:*` 프로토콜을 쓴다(`apps/*/package.json`의 `@last-spark/shared` 참고).

왜 모노레포인가: 소켓 이벤트 이름/페이로드가 클라이언트-서버 양쪽에서 정확히 일치해야 하는 게임성 앱이라, `packages/shared`를 두고 둘 다 같은 타입을 import하게 만드는 게 가장 값싼 안전장치다. 이벤트 하나 바꿀 때 두 군데를 따로 안 맞춰도 컴파일 타임에 어긋남이 잡힌다.

## 명령어

```bash
pnpm install                 # 루트에서 전체 워크스페이스 설치
pnpm run server               # apps/server 개발 서버 (기본 :4000)
pnpm run mobile                # apps/mobile Expo 개발 서버
pnpm run typecheck            # shared → server → mobile 순서로 타입체크
```

## 지금 상태 — 뭐가 진짜로 동작하고 뭐가 스텁인지

이 레포는 "동작하는 스타터"다. `pnpm run server` + `pnpm run mobile`을 같이 띄우면 상태머신 A(대기)→B(라운지)→C(비상)→D(제단)→E(사망) 전체 흐름이 실제 소켓 통신으로 돈다. 다만:

- **배경/캐릭터 비주얼 에셋 없음** — Higgsfield/PixelLab로 실제 아트를 뽑기 전까지 라운지 화면은 자리표시자다 (기획서 9.4, 실행체크리스트 0단계)
- **결제/광고 SDK 미연동** — RevenueCat/AdMob은 스토어 콘솔 계정이 있어야 붙일 수 있어 미설치 상태 (실행체크리스트 4단계)
- **DB 없이도 부팅됨** — `DATABASE_URL` 미설정 시 묘비는 in-memory로만 저장되고 서버 재시작하면 사라짐. 영구 저장하려면 Supabase 등에서 Postgres를 만들고 `apps/server/.env`에 연결해야 함
- **단일 프로세스 전제** — Redis Adapter 미연결이라 서버 인스턴스를 여러 개로 못 늘림(기획서 9.2)

각 앱 README(`apps/mobile/README.md`, `apps/server/README.md`)에 더 구체적인 "동작함/아직 안 함" 목록이 있다.

## 기획서 5.2와 실제 구현의 차이

`packages/shared/src/socket-events.ts`에 기획서 5.2 원표에는 없던 이벤트 4개(`lounge:joined`, `altar:submit`, `emergency:detach`, `presence:update`)가 추가돼 있다. 클라이언트가 서버에 확인 응답을 받거나 명시적으로 트리거를 보내야 하는 지점인데 기획서는 그 왕복까지는 명시하지 않아서, 구현 단계에서 채워 넣은 것이다. 기획서를 고칠 필요는 없고(이건 기획 문서가 아니라 통신 프로토콜 디테일), 코드가 기준이라는 것만 인지하면 된다.

## 문서 구성 규칙

- `README.md`, `CLAUDE.md`, `AGENTS.md`는 각 도구(사람/Claude Code/Cursor·Codex 등)가 자동으로 찾는 고정 파일명·경로다 — 이름을 바꾸거나 다른 곳으로 옮기지 않는다.
- 이 세 파일은 서로 내용을 베끼지 않는다. 각자 자기 독자에게 맞는 톤·분량으로 같은 결론을 요약하는 얇은 진입점이고, 실제 상세 내용(도메인 규칙)의 원본은 `.claude/skills/last-spark-domain/SKILL.md` 하나뿐이다. `SKILL.md`가 `docs/`나 다른 곳이 아니라 이 경로에 있는 이유도 같다 — `.claude/skills/*/SKILL.md`는 Claude Code가 필요할 때만 자동으로 불러오는 스킬 탐색 경로라, 다른 곳으로 옮기면 그냥 아무도 안 읽는 파일이 된다. 도메인 규칙이 바뀌면 SKILL.md부터 고치고, 필요하면 `AGENTS.md`의 요약도 같이 갱신한다(자동 동기화 아님 — 사람이 손으로 맞춰야 함).
- `docs/`(기획·디자인 원본)는 프로젝트명 접두어 없이 문서 제목만으로 파일명을 짓는다 — `기획서.md`, `실행체크리스트.md`, `DESIGN.md`. 이미 이 레포 안에 있으므로 `last-spark-` 접두어는 중복 정보다.

## 컨벤션

- TypeScript strict 모드, 모든 신규 코드는 `packages/shared`의 타입을 최대한 재사용
- 소켓 이벤트를 하나 추가/변경할 때는 반드시 `packages/shared/src/socket-events.ts`부터 고치고, 그다음 서버 핸들러 → 클라이언트 훅 순으로 맞춘다
- 상태머신 전이 로직은 `packages/shared/src/state-machine.ts`의 `evaluateNextState()` 한 곳에만 있어야 한다 — mobile 스토어나 server 룸 로직에 전이 조건을 중복 구현하지 말 것
- 커밋 메시지 규칙은 `.claude/skills/last-spark-domain/SKILL.md`의 "커밋 메시지 규칙" 절 참고 (`<type> : <subject>`, 한글 subject). PR 컨벤션은 아직 미정 — 실제 팀 작업 시작 시점에 정하면 됨
