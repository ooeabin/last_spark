import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@last-spark/shared";
import { getSession, type SocketSession } from "./session";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const EMERGENCY_TIMER_SEC = 10; // 기획서 4.2-D

/**
 * 충전 감지 → 10초 비상 시퀀스 (기획서 4.2-D, 5.2 emergency:*).
 * 10초 안에 emergency:detach가 오지 않으면 traitor:execute를
 * 룸 전체에 브로드캐스트하고 강제 퇴장시킨다.
 */
export function startEmergencyCountdown(io: IOServer, socket: IOSocket, session: SocketSession) {
  if (!session.roomId) return;

  io.to(session.roomId).emit("emergency:start", {
    playerId: socket.id,
    timer: EMERGENCY_TIMER_SEC,
  });

  session.emergencyTimeout = setTimeout(() => {
    io.to(session.roomId!).emit("traitor:execute", { playerId: socket.id });
    // 강제 퇴장: 소켓 연결을 끊어 disconnect 핸들러가 룸 정리를 하게 한다.
    socket.disconnect(true);
  }, EMERGENCY_TIMER_SEC * 1000);
}

export function registerEmergencyHandlers(io: IOServer, socket: IOSocket) {
  socket.on("emergency:detach", () => {
    const session = getSession(socket.id);
    if (!session?.roomId || !session.emergencyTimeout) return;

    clearTimeout(session.emergencyTimeout);
    session.emergencyTimeout = null;
    session.isCharging = false;

    io.to(session.roomId).emit("emergency:cancel", { playerId: socket.id });
  });
}
