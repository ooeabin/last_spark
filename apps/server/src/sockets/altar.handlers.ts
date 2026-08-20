import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  AltarSubmitPayload,
} from "@last-spark/shared";
import { getSession } from "./session";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const MAX_LAST_WORDS_LENGTH = 30; // 기획서 4.2-C

/**
 * altar:submit(C→S, 스타터 확장 이벤트) → altar:broadcast(S→C, 5.2 원본).
 * 1% 방전 제단에서 남긴 유언을 룸 전체 긴급 속보 배너로 송출하고,
 * 세션에 마지막 유언으로 저장해뒀다가 사망/연결종료 시 묘비로 영구 기록한다.
 */
export function registerAltarHandlers(io: IOServer, socket: IOSocket) {
  socket.on("altar:submit", (payload: AltarSubmitPayload) => {
    const session = getSession(socket.id);
    if (!session?.roomId) return;

    const message = payload.message.slice(0, MAX_LAST_WORDS_LENGTH).trim();
    if (!message) return;

    session.lastAltarMessage = { nickname: session.nickname, lastWords: message };

    io.to(session.roomId).emit("altar:broadcast", {
      nickname: session.nickname,
      message,
    });
  });
}
