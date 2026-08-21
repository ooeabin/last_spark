import { useEffect, useRef } from "react";
import { getSocket } from "@/shared/api/socketClient";
import { detectCountryCode } from "@/entities/room";
import { generateNickname, rollCharacter } from "@/entities/player";
import i18n from "@/shared/i18n";
import { useGameStateStore } from "@/features/battery-tracking";
import { useRoomStore } from "./roomStore";
import type { LoungeJoinedPayload, PresenceUpdatePayload } from "@last-spark/shared";

/**
 * 소켓 연결 + 룸 입장(lounge:join)의 생명주기를 관리한다.
 *
 * 버그 수정(2026-08): 원래 이 로직은 LoungeScreen 전용 훅(useLoungeConnection)
 * 안에서만 socket.connect()/disconnect()를 호출했다. 그런데 StateMachineRoot는
 * gameState가 바뀌면 화면 자체를 스위칭하므로, LOUNGE에서 EMERGENCY나
 * LAST_RITES로 전이되는 순간 LoungeScreen이 언마운트되며 소켓까지 끊겼다.
 * 그 결과:
 *   - 방전 제단(LAST_RITES)에서 유언을 제출(altar:submit)해도 서버에 세션이
 *     없어 조용히 무시됨 ("유언남기기 해봤는데 안됨" 버그의 원인)
 *   - 비상 카운트다운(EMERGENCY) 화면도 emergency:start/cancel을 못 받음
 *
 * 기획서 2.2 기준 LOUNGE/EMERGENCY/LAST_RITES/DEAD는 전부 "같은 룸 세션"의
 * 하위 상태라, 연결은 WAITING을 벗어날 때 한 번만 맺고 WAITING으로
 * 돌아올 때만 끊어야 한다. 그래서 화면별이 아니라 StateMachineRoot에서
 * gameState 전체를 보고 이 훅 하나로 관리한다.
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
      socket.emit("lounge:join", {
        countryCode: detectCountryCode(),
        batteryLevel,
        charId: rollCharacter(),
        nickname: generateNickname(i18n.language),
      });
      joined.current = true;
    }
    // batteryLevel은 입장 시점 스냅샷만 필요하므로 의존성에서 제외한다
    // (매 % 변화마다 재입장하면 안 됨).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);
}
