import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/shared/api/socketClient";
import { detectCountryCode } from "@/entities/room";
import { generateNickname, rollCharacter } from "@/entities/player";
import i18n from "@/shared/i18n";
import { useGameStateStore } from "@/features/battery-tracking";
import type { LoungeJoinedPayload } from "@last-spark/shared";

/**
 * 상태머신 B(LOUNGE) 진입 시 소켓 연결 + lounge:join, 벗어나면 disconnect.
 * 대기 화면(A)에서는 소켓이 필요 없으므로 이 훅은 LoungeScreen에서만 사용한다.
 */
export function useLoungeConnection() {
  const batteryLevel = useGameStateStore((s) => s.batteryLevel);
  const [room, setRoom] = useState<LoungeJoinedPayload | null>(null);
  const identity = useRef({
    countryCode: detectCountryCode(),
    nickname: generateNickname(i18n.language),
    charId: rollCharacter(),
  });

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    socket.emit("lounge:join", {
      countryCode: identity.current.countryCode,
      batteryLevel,
      charId: identity.current.charId,
      nickname: identity.current.nickname,
    });

    const onJoined = (payload: LoungeJoinedPayload) => setRoom(payload);
    const onPresence = (payload: { roomId: string; occupants: number }) => {
      setRoom((prev) => (prev && prev.roomId === payload.roomId ? { ...prev, occupants: payload.occupants } : prev));
    };

    socket.on("lounge:joined", onJoined);
    socket.on("presence:update", onPresence);

    return () => {
      socket.off("lounge:joined", onJoined);
      socket.off("presence:update", onPresence);
      socket.disconnect();
      setRoom(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 라운지 진입 시 1회만 연결 — batteryLevel 변경은 별도로 battery:change 이벤트로 전송(features/battery-tracking 연동은 TODO)

  return { room, identity: identity.current };
}
