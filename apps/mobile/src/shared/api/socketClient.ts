import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@last-spark/shared";
import { env } from "../config/env";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

/**
 * 소켓 클라이언트는 앱 전역에서 단 하나만 유지한다(싱글턴).
 * autoConnect는 false로 두고, lounge 진입(상태머신 B 진입) 시점에
 * features/lounge-matching에서 명시적으로 connect()를 호출한다 —
 * 대기 화면(A)에서는 소켓 연결이 필요 없기 때문.
 */
export function getSocket(): AppSocket {
  if (!socket) {
    socket = io(env.socketServerUrl, {
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return socket;
}
