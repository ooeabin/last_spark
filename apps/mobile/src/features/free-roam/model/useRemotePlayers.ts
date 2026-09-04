import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/shared/api/socketClient";
import type { PlayerSyncMovePayload } from "@last-spark/shared";
import { CAT_FRAME_COUNT } from "@/entities/player";
import {
  TICK_MS,
  MOVE_EMIT_INTERVAL_MS,
  REMOTE_STALE_MS,
  WALK_FRAME_INTERVAL_MS,
  IDLE_FRAME_INTERVAL_MS,
} from "./constants";

type Direction = PlayerSyncMovePayload["direction"];
type RemoteSyncMove = PlayerSyncMovePayload & { playerId: string; nickname: string };

interface RemotePlayerInternal {
  playerId: string;
  nickname: string;
  direction: Direction;
  /** 스프라이트가 좌우 반전만 지원해서, 상하 이동 중엔 마지막 좌우 방향을 유지한다 */
  faceRight: boolean;
  prevX: number;
  prevY: number;
  targetX: number;
  targetY: number;
  updatedAt: number;
  movingUntil: number;
  frame: number;
  lastFrameAt: number;
}

export interface RemotePlayerView {
  playerId: string;
  nickname: string;
  /** 0~1 정규화 좌표 (필드 크기에 곱해서 픽셀로 변환) */
  x: number;
  y: number;
  direction: Direction;
  animation: "walk" | "idle";
  frame: number;
  faceRight: boolean;
}

const MOVING_HOLD_MS = MOVE_EMIT_INTERVAL_MS * 2.5;
const POSITION_EPSILON = 0.002;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * 같은 룸의 다른 플레이어 위치를 소켓으로 받아 화면에 그릴 수 있는 형태로 유지한다.
 *
 * 서버는 x/y/direction만 쏘고 프레임·애니메이션 정보는 안 보내므로, 클라이언트가
 * 업데이트 간격(마지막 수신~다음 수신)을 스스로 보간해 부드럽게 움직이는 것처럼
 * 그리고, 위치 변화가 있었는지로 걷기/대기 애니메이션을 판단한다. player:left를
 * 놓쳤을 때(네트워크 끊김 등) 대비해 일정 시간 갱신이 없으면 화면에서도 지운다.
 */
export function useRemotePlayers() {
  const playersRef = useRef(new Map<string, RemotePlayerInternal>());
  const [view, setView] = useState<RemotePlayerView[]>([]);

  useEffect(() => {
    const socket = getSocket();

    const onSyncMove = (payload: RemoteSyncMove) => {
      const now = Date.now();
      const players = playersRef.current;
      const prev = players.get(payload.playerId);

      if (!prev) {
        players.set(payload.playerId, {
          playerId: payload.playerId,
          nickname: payload.nickname,
          direction: payload.direction,
          faceRight: payload.direction !== "left",
          prevX: payload.x,
          prevY: payload.y,
          targetX: payload.x,
          targetY: payload.y,
          updatedAt: now,
          movingUntil: 0,
          frame: 0,
          lastFrameAt: now,
        });
        return;
      }

      const moved = Math.hypot(payload.x - prev.targetX, payload.y - prev.targetY) > POSITION_EPSILON;
      prev.prevX = prev.targetX;
      prev.prevY = prev.targetY;
      prev.targetX = payload.x;
      prev.targetY = payload.y;
      prev.direction = payload.direction;
      if (payload.direction === "left" || payload.direction === "right") {
        prev.faceRight = payload.direction === "right";
      }
      prev.nickname = payload.nickname;
      prev.updatedAt = now;
      if (moved) prev.movingUntil = now + MOVING_HOLD_MS;
    };

    const onPlayerLeft = ({ playerId }: { playerId: string }) => {
      playersRef.current.delete(playerId);
    };

    socket.on("player:sync_move", onSyncMove);
    socket.on("player:left", onPlayerLeft);

    return () => {
      socket.off("player:sync_move", onSyncMove);
      socket.off("player:left", onPlayerLeft);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const players = playersRef.current;
      const next: RemotePlayerView[] = [];

      for (const [playerId, p] of players) {
        if (now - p.updatedAt > REMOTE_STALE_MS) {
          players.delete(playerId);
          continue;
        }

        const progress = Math.min(1, (now - p.updatedAt) / MOVE_EMIT_INTERVAL_MS);
        const x = lerp(p.prevX, p.targetX, progress);
        const y = lerp(p.prevY, p.targetY, progress);
        const animation: "walk" | "idle" = now < p.movingUntil ? "walk" : "idle";

        const frameIntervalMs = animation === "walk" ? WALK_FRAME_INTERVAL_MS : IDLE_FRAME_INTERVAL_MS;
        if (now - p.lastFrameAt >= frameIntervalMs) {
          p.frame = (p.frame + 1) % CAT_FRAME_COUNT;
          p.lastFrameAt = now;
        }

        next.push({
          playerId,
          nickname: p.nickname,
          x,
          y,
          direction: p.direction,
          animation,
          frame: p.frame,
          faceRight: p.faceRight,
        });
      }

      setView(next);
    }, TICK_MS);

    return () => clearInterval(id);
  }, []);

  return view;
}
