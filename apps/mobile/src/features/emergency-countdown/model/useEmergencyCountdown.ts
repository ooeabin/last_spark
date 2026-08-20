import { useEffect, useState } from "react";
import { getSocket } from "@/shared/api/socketClient";
import { useGameStateStore } from "@/features/battery-tracking";
import type { EmergencyStartPayload, TraitorExecutePayload } from "@last-spark/shared";

/**
 * 충전 감지 → 10초 비상 시퀀스 (기획서 4.2-D). 서버가 진행 시간의
 * 기준이고(신뢰 주체), 클라이언트는 UI 카운트다운만 로컬에서 보여준다.
 */
export function useEmergencyCountdown() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const forceExecuted = useGameStateStore((s) => s.forceExecuted);
  const emergencyDetached = useGameStateStore((s) => s.emergencyDetached);

  useEffect(() => {
    const socket = getSocket();

    const onStart = (payload: EmergencyStartPayload) => {
      setSecondsLeft(payload.timer);
    };
    const onCancel = () => {
      setSecondsLeft(null);
      emergencyDetached();
    };
    const onExecute = (_payload: TraitorExecutePayload) => {
      setSecondsLeft(null);
      forceExecuted();
    };

    socket.on("emergency:start", onStart);
    socket.on("emergency:cancel", onCancel);
    socket.on("traitor:execute", onExecute);

    return () => {
      socket.off("emergency:start", onStart);
      socket.off("emergency:cancel", onCancel);
      socket.off("traitor:execute", onExecute);
    };
  }, [emergencyDetached, forceExecuted]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const detach = () => getSocket().emit("emergency:detach");

  return { secondsLeft, detach };
}
