import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@last-spark/shared";
import { roomManager } from "../rooms/roomManager";
import { destroySession, getSession } from "./session";
import { createGravestone } from "../db/gravestoneRepository";
import { clearBatteryHistory } from "../lib/antiCheat";
import { registerLoungeHandlers } from "./lounge.handlers";
import { registerBatteryHandlers } from "./battery.handlers";
import { registerEmergencyHandlers } from "./emergency.handlers";
import { registerAltarHandlers } from "./altar.handlers";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerSocketHandlers(io: IOServer) {
  io.on("connection", (socket: IOSocket) => {
    registerLoungeHandlers(io, socket);
    registerBatteryHandlers(io, socket);
    registerEmergencyHandlers(io, socket);
    registerAltarHandlers(io, socket);

    socket.on("disconnect", async () => {
      const session = getSession(socket.id);

      // 기획서 4.2-C: 0% 도달 또는 연결 종료 시 묘비 생성 + 유언장 영구 저장.
      // 마지막으로 제단에 유언을 남긴 적이 있을 때만 묘비를 만든다.
      if (session?.lastAltarMessage) {
        await createGravestone({
          countryCode: session.countryCode,
          nickname: session.lastAltarMessage.nickname,
          lastWords: session.lastAltarMessage.lastWords,
          skinId: session.charId,
          graveType: "basic",
        }).catch((err) => console.error("[gravestone] persist failed:", err));
      }

      if (session?.roomId) {
        roomManager.leaveRoom(socket.id);
        io.to(session.roomId).emit("presence:update", {
          roomId: session.roomId,
          occupants: roomManager.getRoom(session.roomId)?.occupants ?? 0,
        });
      }

      roomManager.removePlayer(socket.id);
      clearBatteryHistory(socket.id);
      destroySession(socket.id);
    });
  });
}
