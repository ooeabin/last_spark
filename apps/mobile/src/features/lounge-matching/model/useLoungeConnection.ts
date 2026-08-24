import { useRoomStore } from "./roomStore";

/**
 * LoungeScreen에서 현재 룸 정보(roomId/occupants 등)를 읽기 위한 selector.
 *
 * 읽기 전용이다 — 소켓 연결과 lounge:join은 화면보다 오래 살아야 하는
 * room-scope 생명주기라 `useRoomConnection`이 맡는다.
 */
export function useLoungeConnection() {
  const room = useRoomStore((s) => s.room);
  return { room };
}
