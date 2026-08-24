# @last-spark/server

Last Spark 백엔드 — Fastify REST + Socket.io 실시간 라운지 서버. 기획서 5장(DB 스키마·소켓 이벤트), 9.2(백엔드 스택) 기준으로 스캐폴딩된 **동작하는 스타터**입니다.

## 로컬 실행

```bash
# 루트에서 (모노레포 워크스페이스 설치)
pnpm install

# DATABASE_URL 없이도 바로 실행 가능 — 묘비는 in-memory로 폴백 저장됨
pnpm run server
```

`.env.example`을 `.env`로 복사하고 `DATABASE_URL`을 채우면 실제 Postgres(Supabase 권장)에 영구 저장됩니다.

```bash
cp apps/server/.env.example apps/server/.env
# DATABASE_URL 채운 뒤
pnpm --filter @last-spark/server prisma:generate
pnpm --filter @last-spark/server prisma:migrate
```

## 지금 이 스캐폴드가 하는 일 / 하지 않는 일

**동작함**
- 국가별 룸 매칭 + 정원(30명) 초과 시 분점 자동 생성 (`src/rooms/roomManager.ts`)
- 소켓 이벤트 5.2 전체 (`src/sockets/*.handlers.ts`) — 입장, 이동 동기화, 배터리 변경, 비상 카운트다운(10초), 제단 유언 브로드캐스트
- 연결 종료 시 마지막 유언을 묘비로 영구 저장 (DB 없으면 in-memory)
- 배터리 변화율 기반 최소 부정사용 탐지(`src/lib/antiCheat.ts`, 경고 로그만 — 강퇴 정책은 TODO)

**아직 안 함 (TODO)**
- Redis Adapter로 다중 인스턴스 확장 (지금은 단일 프로세스 전제)
- Supabase Auth / 디바이스ID 세션 인증
- Zod 기반 페이로드 스키마 검증(현재는 타입만 있고 런타임 검증 없음)
- 배포 파이프라인(Railway/Fly.io) — 실행체크리스트 2단계 참고

## 이벤트 계약

소켓 이벤트의 이름과 페이로드는 `packages/shared/src/socket-events.ts`가 단일 소스입니다(기획서 5.2). 이벤트를 추가하거나 바꿀 때는 이 파일부터 고치고, 그다음 서버 핸들러 → 클라이언트 훅 순으로 맞춥니다.
