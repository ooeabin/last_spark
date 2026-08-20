import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  BatteryChangePayload,
} from "@last-spark/shared";
import { getSession } from "./session";
import { isSuspiciousBatteryChange } from "../lib/antiCheat";
import { startEmergencyCountdown } from "./emergency.handlers";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * battery:change — 기획서 5.2. 배터리 1% 감소마다 클라이언트가 전달.
 * 서버는 (1) 부정사용 여부 최소 검증, (2) 값 갱신, (3) 충전 감지 시
 * 비상 카운트다운 트리거까지 담당한다.
 *
 * 주의: 5.2 원표에는 batteryLevel만 있고 isCharging 필드가 없다.
 * 실제 구현에서는 충전 감지가 필수라 페이로드에 isCharging을 얹어
 * 보내는 걸 권장한다(클라이언트 shared 타입에 맞춰 확장 가능).
 */
export function registerBatteryHandlers(io: IOServer, socket: IOSocket) {
  socket.on("battery:change", (payload: BatteryChangePayload & { isCharging?: boolean }) => {
    const session = getSession(socket.id);
    if (!session) return;

    if (isSuspiciousBatteryChange(socket.id, payload.batteryLevel, Date.now())) {
      console.warn(`[battery] suspicious change from ${socket.id}:`, payload);
      // 스타터 단계에서는 로그만 남기고 강퇴하지 않는다. 실서비스 전환 시
      // 반복 위반 카운트를 두고 임계치 초과 시 세션 종료하는 정책 추가 필요.
    }

    session.batteryLevel = payload.batteryLevel;

    const wasCharging = session.isCharging;
    if (typeof payload.isCharging === "boolean") {
      session.isCharging = payload.isCharging;
    }

    if (!wasCharging && session.isCharging && session.roomId) {
      startEmergencyCountdown(io, socket, session);
    }
  });
}
