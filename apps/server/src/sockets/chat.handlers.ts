import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, ChatSendPayload } from "@last-spark/shared";
import { MAX_CHAT_MESSAGE_LENGTH } from "@last-spark/shared";
import { getSession } from "./session";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * chat:send — 근접 채팅 (기획서 4.2-B).
 *
 * 서버는 길이 검증과 룸 브로드캐스트만 한다. "반경 150 이내에게만 말풍선"은
 * 수신 클라이언트가 이미 player:sync_move로 동기화된 상대 좌표로 판단한다 —
 * 서버가 좌표를 저장·판정하려면 모든 이동을 상태로 들고 있어야 해서 배보다
 * 배꼽이 커진다. 보낸 사람 본인의 말풍선은 클라이언트가 로컬로 즉시 띄우므로
 * 송신자를 제외하고(socket.to) 뿌린다.
 */
export function registerChatHandlers(_io: IOServer, socket: IOSocket) {
  socket.on("chat:send", (payload: ChatSendPayload) => {
    const session = getSession(socket.id);
    if (!session?.roomId) return;

    const message = typeof payload?.message === "string" ? payload.message.trim() : "";
    if (!message || message.length > MAX_CHAT_MESSAGE_LENGTH) return;

    socket.to(session.roomId).emit("chat:message", {
      playerId: socket.id,
      nickname: session.nickname,
      message,
    });
  });
}
