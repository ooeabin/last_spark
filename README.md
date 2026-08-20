# 마지막 불꽃 (Last Spark)

> The 10% Battery Lounge — 폰이 꺼지기 전, 가장 뜨겁게 타오르는 10분

배터리 잔량 10% 이하에서만 입장 가능한, 국가별로 매칭되는 2D(패럴랙스 배경 + 도트 캐릭터) 메타버스 시한부 라운지.

기획 원본은 [`docs/기획서.md`](docs/기획서.md), 레포를 어떻게 다루는지는 [`CLAUDE.md`](CLAUDE.md), 도메인 규칙은 [`.claude/skills/last-spark-domain/SKILL.md`](.claude/skills/last-spark-domain/SKILL.md)를 참고하세요.

## 빠른 시작

```bash
pnpm install

# 터미널 1 — 백엔드
pnpm run server

# 터미널 2 — 모바일 앱
pnpm run mobile
```

`pnpm run mobile`이 띄운 Expo 개발 서버의 QR을 Expo Go 앱으로 스캔하거나 시뮬레이터에서 열면, 상태머신 전체(대기 → 라운지 → 비상 → 제단 → 사망)를 실제 소켓 통신으로 체험할 수 있습니다. 배터리는 `__DEV__` 빌드에서 화면 하단 개발자 컨트롤로 수동 조작 가능합니다.

## 구조

```
last-spark/
  docs/                          기획서 · 실행체크리스트 · 디자인 시스템(DESIGN.md)
  packages/shared/                상태머신 · 소켓 이벤트 · 엔티티 타입 (단일 소스)
  apps/mobile/                    React Native + Expo 클라이언트 (FSD-lite)
  apps/server/                    Fastify + Socket.io 백엔드
  .claude/skills/last-spark-domain/  도메인 규칙 스킬 (Claude Code)
  .cursor/rules/last-spark.mdc    같은 도메인 규칙 요약 (Cursor)
  pnpm-workspace.yaml             pnpm 워크스페이스 정의
```

패키지 매니저는 pnpm입니다. `corepack enable`을 해두면 `package.json`의 `packageManager` 필드에 맞춰 버전이 자동으로 맞춰집니다.

## 문서

| 문서 | 용도 |
|---|---|
| `docs/기획서.md` | 기획 원본 — 기능 추가/변경 시 먼저 확인 |
| `docs/실행체크리스트.md` | 계정 개설·결제 등 사람이 직접 해야 하는 일 (코드와 무관) |
| `docs/DESIGN.md` | 디자인 시스템 참고 자료 (`apps/mobile/src/shared/theme/tokens.ts`로 반영됨) |
| `CLAUDE.md` | 레포 전체 구조·명령어 (Claude Code용, 파일명 고정) |
| `apps/mobile/CLAUDE.md`, `apps/server/CLAUDE.md` | 앱별 컨벤션 |
| `.claude/skills/last-spark-domain/SKILL.md` | 상태머신·소켓 계약·DB·커밋 규칙 등 도메인 규칙 (도구 무관 내용, Claude Code 스킬 형식) |
| `.cursor/rules/last-spark.mdc` | 위 내용을 Cursor가 항상 읽도록 요약한 규칙 (Cursor용, 경로/포맷 고정) |

**문서 정리 규칙**: 루트의 `README.md`/`CLAUDE.md`와 `.cursor/rules/*.mdc`는 각 도구가 자동으로 읽는 고정 파일명·경로라 임의로 바꾸지 않는다. 이 세 곳은 서로 내용을 복사하지 않고 각자 다른 대상(사람/Claude Code/Cursor)에게 같은 결론을 요약해서 보여주는 얇은 진입점이고, 실제 상세 내용은 `docs/`(기획·디자인 원본)와 `.claude/skills/last-spark-domain/SKILL.md`(도메인 규칙 원본)에만 둔다. `docs/` 안 파일명은 프로젝트명 접두어 없이 문서 제목만 쓴다(`기획서.md`, `실행체크리스트.md`, `DESIGN.md`) — 이미 레포 안에 있어서 접두어가 중복 정보이기 때문.
