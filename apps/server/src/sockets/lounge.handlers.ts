import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  LoungeJoinPayload,
  PlayerSyncMovePayload,
} from "@last-spark/shared";
import { roomManager } from "../rooms/roomManager";
import { createSession, getSession } from "./session";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/** lounge:join — 기획서 5.2. 국가별 룸 매칭 후 lounge:joined + presence:update */
export function registerLoungeHandlers(io: IOServer, socket: IOSocket) {
  socket.on("lounge:join", (payload: LoungeJoinPayload) => {
    const session = createSession(socket.id, {
      playerId: socket.id,
      countryCode: payload.countryCode,
      nickname: payload.nickname,
      charId: payload.charId,
      roomId: null,
      batteryLevel: payload.batteryLevel,
      isCharging: false,
    });

    const room = roomManager.assignRoom(payload.countryCode);
    roomManager.joinRoom(
      {
        id: socket.id,
        nickname: payload.nickname,
        charId: payload.charId,
        countryCode: payload.countryCode,
        batteryLevel: payload.batteryLevel,
        isCharging: false,
        roomId: null,
      },
      room.id
    );

    session.roomId = room.id;
    socket.join(room.id);

    socket.emit("lounge:joined", {
      roomId: room.id,
      countryCode: room.countryCode,
      capacity: room.capacity,
      occupants: room.occupants,
    });

    io.to(room.id).emit("presence:update", {
      roomId: room.id,
      occupants: room.occupants,
    });
  });

  // player:sync_move — 같은 룸의 다른 플레이어에게만 좌표 브로드캐스트
  socket.on("player:sync_move", (payload: PlayerSyncMovePayload) => {
    const session = getSession(socket.id);
    if (!session?.roomId) return;
    socket.to(session.roomId).emit("player:sync_move", {
      ...payload,
      playerId: socket.id,
      nickname: session.nickname,
    });
  });
}
