import { useEffect, useState } from "react";
import { getSocket } from "@/shared/api/socketClient";
import { useGameStateStore } from "@/features/battery-tracking";
import { MAX_ALTAR_MESSAGE_LENGTH, type AltarBroadcastPayload } from "@last-spark/shared";

const MAX_LENGTH = MAX_ALTAR_MESSAGE_LENGTH; // packages/shared/src/entities.ts가 단일 소스 (기획서 4.2-C)

/**
 * 1% 방전 제단 (기획서 4.2-C). 제단이 열려있는 동안엔 gameStateStore의
 * altarOpen 플래그를 true로 유지해 배터리 상태 전이를 보류시킨다 —
 * 그러지 않으면 작성 도중 방전 전이가 일어나 입력하던 유언이 사라진다.
 */
export function useAltar() {
  const [message, setMessage] = useState("");
  const [banner, setBanner] = useState<AltarBroadcastPayload | null>(null);
  const openAltar = useGameStateStore((s) => s.openAltar);
  const closeAltar = useGameStateStore((s) => s.closeAltar);
  const setLastWords = useGameStateStore((s) => s.setLastWords);

  useEffect(() => {
    openAltar();
    return () => closeAltar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onBroadcast = (payload: AltarBroadcastPayload) => setBanner(payload);
    socket.on("altar:broadcast", onBroadcast);
    return () => {
      socket.off("altar:broadcast", onBroadcast);
    };
  }, []);

  const submit = () => {
    const trimmed = message.slice(0, MAX_LENGTH).trim();
    if (!trimmed) return;
    getSocket().emit("altar:submit", { message: trimmed });
    // 사망 화면 묘비에 새기려면 제단이 언마운트된 뒤에도 남아 있어야 한다.
    setLastWords(trimmed);
  };

  return { message, setMessage: (v: string) => setMessage(v.slice(0, MAX_LENGTH)), submit, banner, maxLength: MAX_LENGTH };
}
