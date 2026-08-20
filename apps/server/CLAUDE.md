# apps/server — 백엔드 가이드

Fastify(REST) + Socket.io(실시간). FSD는 프론트엔드 방법론이라 여기엔 적용하지 않고, 도메인별 레이어로 나눴다.

```
src/
  config/     환경변수 파싱 (env.ts)
  sockets/    소켓 연결 생명주기 + 이벤트 핸들러 (도메인별 파일 분리)
  rooms/      국가별 룸 매칭·정원 관리 (roomManager.ts)
  routes/     REST 엔드포인트 (묘비 갤러리, 상점 카탈로그)
  db/         Prisma 클라이언트 + 레포지토리 (DB 없으면 in-memory 폴백)
  lib/        도메인 유틸 (부정사용 탐지 등, 특정 소켓 이벤트에 종속되지 않는 것)
```

## 새 소켓 이벤트를 추가할 때

1. `packages/shared/src/socket-events.ts`에 페이로드 타입 + `ClientToServerEvents`/`ServerToClientEvents` 맵 추가
2. `src/sockets/`에 해당 도메인 핸들러 파일이 있으면 거기에, 없으면 새 파일로 (`registerXxxHandlers(io, socket)` 형태를 따를 것)
3. `src/sockets/index.ts`의 `registerSocketHandlers()`에서 새 핸들러 등록
4. 연결이 끊길 때 정리가 필요한 상태가 있으면 `session.ts`의 `SocketSession`에 필드 추가 + `index.ts`의 `disconnect` 핸들러에서 정리

세션 상태(`sockets/session.ts`)와 룸 상태(`rooms/roomManager.ts`)는 둘 다 인메모리 `Map`이다. 여러 서버 인스턴스로 확장할 때(기획서 9.2 Redis Adapter) 이 두 파일이 가장 먼저 손봐야 할 지점 — 지금은 단일 프로세스 전제로 짜여 있다.

## DB

`prisma/schema.prisma`가 기획서 5.1 스키마 그대로다. `src/db/prismaClient.ts`는 `DATABASE_URL`이 없으면 `null`을 반환하고, `src/db/gravestoneRepository.ts`가 그 경우 in-memory 배열로 폴백한다 — 로컬 개발 중 DB 없이도 `pnpm run dev`가 바로 되게 하려는 의도다. 실서비스 전환 전엔 반드시 `DATABASE_URL`을 채우고 `pnpm --filter @last-spark/server prisma:migrate`를 돌려야 한다.

새 테이블이 필요하면 `schema.prisma`에 모델을 추가하고, `gravestoneRepository.ts` 패턴대로 in-memory 폴백이 있는 레포지토리를 만드는 걸 권장한다(스타터 단계에서 DB 없이도 계속 개발 가능하게).

## 부정사용 방지

`src/lib/antiCheat.ts`는 배터리 변화율만 보는 최소 휴리스틱이다(기획서 8장 "부정 사용 가능성"). 지금은 의심스러운 변화를 감지해도 `console.warn`만 하고 강퇴하지 않는다 — 오탐으로 정상 유저를 차단하는 게 더 나쁜 결과라 판단해서다. 실서비스 전환 시 반복 위반 카운트 기반 정책을 추가하는 걸 권장.

## 실행

```bash
pnpm install                                          # 루트에서
pnpm run server                                        # DATABASE_URL 없이도 바로 됨
cp apps/server/.env.example apps/server/.env          # 실제 DB 연결 시
pnpm --filter @last-spark/server prisma:generate
pnpm --filter @last-spark/server prisma:migrate
```
