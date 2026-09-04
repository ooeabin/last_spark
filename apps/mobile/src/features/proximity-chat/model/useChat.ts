import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_CHAT_MESSAGE_LENGTH, type ChatMessagePayload } from "@last-spark/shared";
import { getSocket } from "@/shared/api/socketClient";
import { CHAT_BUBBLE_DURATION_MS } from "./constants";

/**
 * 근접 채팅 (기획서 4.2-B) — 메시지를 보내고, 같은 룸에서 온 메시지를
 * "playerId → 말풍선 내용" 맵으로 유지한다. 반경 필터(150 이내만 표시)는
 * 상대 좌표를 아는 씬(LoungeScene) 쪽에서 한다.
 *
 * 내 말풍선(myBubble)은 서버 왕복 없이 로컬에서 즉시 띄운다 — 서버는
 * 송신자를 제외하고 브로드캐스트한다(chat.handlers.ts).
 */
export function useChat() {
  const [bubbles, setBubbles] = useState<Record<string, string>>({});
  const [myBubble, setMyBubble] = useState<string | null>(null);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const myTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const timers = timersRef.current;

    const onMessage = ({ playerId, message }: ChatMessagePayload) => {
      setBubbles((prev) => ({ ...prev, [playerId]: message }));
      const existing = timers.get(playerId);
      if (existing) clearTimeout(existing);
      timers.set(
        playerId,
        setTimeout(() => {
          timers.delete(playerId);
          setBubbles((prev) => {
            const { [playerId]: _expired, ...rest } = prev;
            return rest;
          });
        }, CHAT_BUBBLE_DURATION_MS),
      );
    };

    socket.on("chat:message", onMessage);
    return () => {
      socket.off("chat:message", onMessage);
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      if (myTimerRef.current) clearTimeout(myTimerRef.current);
    };
  }, []);

  const send = useCallback((raw: string) => {
    const message = raw.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);
    if (!message) return;
    getSocket().emit("chat:send", { message });

    setMyBubble(message);
    if (myTimerRef.current) clearTimeout(myTimerRef.current);
    myTimerRef.current = setTimeout(() => setMyBubble(null), CHAT_BUBBLE_DURATION_MS);
  }, []);

  return { bubbles, myBubble, send };
}
