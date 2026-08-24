import { useEffect, useRef } from "react";
import { getSocket } from "@/shared/api/socketClient";
import { detectCountryCode } from "@/entities/room";
import { usePlayerIdentity } from "@/entities/player";
import { useGameStateStore } from "@/features/battery-tracking";
import { useRoomStore } from "./roomStore";
import type { LoungeJoinedPayload, PresenceUpdatePayload } from "@last-spark/shared";

/**
 * 소켓 연결 + 룸 입장(lounge:join)의 생명주기를 관리한다.
 *
 * 기획서 2.2 기준 LOUNGE/EMERGENCY/LAST_RITES/DEAD는 전부 "같은 룸 세션"의
 * 하위 상태다. 따라서 연결은 WAITING을 벗어날 때 한 번만 맺고 WAITING으로
 * 돌아올 때만 끊는다.
 *
 * 이 훅을 화면이 아니라 StateMachineRoot에서 1회 실행하는 이유도 그것이다 —
 * StateMachineRoot는 gameState가 바뀌면 화면을 통째로 스위칭하므로, 연결을
 * 화면 훅에 두면 LOUNGE→LAST_RITES 전이에서 화면과 함께 소켓이 끊긴다.
 * 그러면 제단 유언 제출(altar:submit)이나 emergency:start/cancel 수신이
 * 에러 없이 조용히 실패한다.
 */
export function useRoomConnection() {
  const gameState = useGameStateStore((s) => s.gameState);
  const batteryLevel = useGameStateStore((s) => s.batteryLevel);
  const setRoom = useRoomStore((s) => s.setRoom);
  const updateOccupants = useRoomStore((s) => s.updateOccupants);
  const joined = useRef(false);

  // 서버 이벤트 구독은 소켓 인스턴스가 살아있는 동안 항상 붙여둔다(연결 전에도 무해).
  useEffect(() => {
    const socket = getSocket();
    const onJoined = (payload: LoungeJoinedPayload) => setRoom(payload);
    const onPresence = (payload: PresenceUpdatePayload) => updateOccupants(payload.roomId, payload.occupants);

    socket.on("lounge:joined", onJoined);
    socket.on("presence:update", onPresence);

    return () => {
      socket.off("lounge:joined", onJoined);
      socket.off("presence:update", onPresence);
    };
  }, [setRoom, updateOccupants]);

  // WAITING을 벗어날 때 1회 연결+입장, WAITING으로 돌아오면 연결 종료.
  useEffect(() => {
    const socket = getSocket();

    if (gameState === "WAITING") {
      if (joined.current) {
        socket.disconnect();
        setRoom(null);
        joined.current = false;
      }
      return;
    }

    if (!joined.current) {
      socket.connect();
      // 대기 화면에서 보여준 것과 같은 캐릭터로 입장해야 하므로
      // 여기서 새로 뽑지 않고 세션 고정 identity를 그대로 쓴다.
      const { charId, nickname } = usePlayerIdentity.getState();
      socket.emit("lounge:join", {
        countryCode: detectCountryCode(),
        batteryLevel,
        charId,
        nickname,
      });
      joined.current = true;
    }
    // batteryLevel은 입장 시점 스냅샷만 필요하므로 의존성에서 제외한다
    // (매 % 변화마다 재입장하면 안 됨).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);
}
