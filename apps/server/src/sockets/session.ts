import type { Gravestone } from "@last-spark/shared";

/**
 * 소켓 1개당 붙는 인메모리 세션 상태. Player 엔티티(룸 배정)와는 별개로,
 * 비상 카운트다운 타이머·마지막 유언 같은 "이 연결에서만 의미 있는" 값을
 * 들고 있는다.
 */
export interface SocketSession {
  playerId: string;
  countryCode: string;
  nickname: string;
  charId: string;
  roomId: string | null;
  batteryLevel: number;
  isCharging: boolean;
  emergencyTimeout: NodeJS.Timeout | null;
  lastAltarMessage: Pick<Gravestone, "nickname" | "lastWords"> | null;
}

const sessions = new Map<string, SocketSession>();

export function createSession(socketId: string, init: Omit<SocketSession, "emergencyTimeout" | "lastAltarMessage">) {
  const session: SocketSession = {
    ...init,
    emergencyTimeout: null,
    lastAltarMessage: null,
  };
  sessions.set(socketId, session);
  return session;
}

export function getSession(socketId: string) {
  return sessions.get(socketId) ?? null;
}

export function destroySession(socketId: string) {
  const session = sessions.get(socketId);
  if (session?.emergencyTimeout) clearTimeout(session.emergencyTimeout);
  sessions.delete(socketId);
}
