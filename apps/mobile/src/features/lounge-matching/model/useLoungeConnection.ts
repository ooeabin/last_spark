import { useRoomStore } from "./roomStore";

/**
 * LoungeScreen에서 현재 룸 정보(roomId/occupants 등)를 읽기 위한 selector.
 *
 * 소켓 연결/lounge:join 자체는 더 이상 이 훅이 관리하지 않는다 — LOUNGE
 * 진입 시점부터 WAITING으로 돌아갈 때까지(EMERGENCY/LAST_RITES 포함) 계속
 * 살아있어야 하는 room-scope 상태라, StateMachineRoot에서 1회 실행되는
 * useRoomConnection이 그 생명주기를 맡는다(2026-08, 화면 전환 시 소켓이
 * 끊겨 제단 유언 제출이 조용히 실패하던 버그 수정과 함께 분리).
 */
export function useLoungeConnection() {
  const room = useRoomStore((s) => s.room);
  return { room };
}
