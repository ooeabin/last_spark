import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/shared/api/socketClient";
import type { PlayerSyncMovePayload } from "@last-spark/shared";
import { CAT_FRAME_COUNT } from "@/entities/player";
import {
  TICK_MS,
  STEP_PX_PER_TICK,
  ARRIVE_EPSILON_PX,
  MOVE_EMIT_INTERVAL_MS,
  HEARTBEAT_INTERVAL_MS,
  WALK_FRAME_INTERVAL_MS,
  IDLE_FRAME_INTERVAL_MS,
} from "./constants";

type Direction = PlayerSyncMovePayload["direction"];

interface FieldSize {
  width: number;
  height: number;
}

interface CharSize {
  width: number;
  height: number;
}

export interface LocalMovementState {
  x: number;
  y: number;
  direction: Direction;
  animation: "walk" | "idle";
  frame: number;
  faceRight: boolean;
}

/**
 * 내 캐릭터의 자유 이동 시뮬레이션 (기획서 2.1.1 — 라운지 전 영역 배회).
 *
 * 화면 탭으로 목표 지점을 받아 한 틱씩 다가가며, 이동 중에는 socket으로
 * player:sync_move를 던진다(스로틀). 정지 중에도 일정 주기로 한 번씩 쏘는
 * 이유는 다른 클라이언트가 나를 "연결 끊김"으로 오인해 지우지 않게 하기
 * 위한 하트비트다 — 서버가 player:left를 확실히 보장하지 못하는 경우
 * (네트워크 끊김 등) 대비다.
 */
// (x, y)는 캐릭터의 "발밑" 앵커 좌표다 — 렌더링 쪽(PlayerAvatar)이 top = y - height로
// 그리는 것과 맞춰야 해서, 세로 클램프는 half가 아니라 캐릭터 전체 높이를 기준으로 한다.
function clampToField(px: number, py: number, field: FieldSize, char: CharSize) {
  const halfW = char.width / 2;
  const x = Math.min(Math.max(px, halfW), Math.max(halfW, field.width - halfW));
  const y = Math.min(Math.max(py, char.height), Math.max(char.height, field.height));
  return { x, y };
}

export function useLocalMovement(fieldSize: FieldSize, charSize: CharSize) {
  const boundsRef = useRef(fieldSize);
  boundsRef.current = fieldSize;
  const charSizeRef = useRef(charSize);
  charSizeRef.current = charSize;

  const stateRef = useRef({
    x: fieldSize.width / 2,
    y: fieldSize.height * 0.85,
    target: null as { x: number; y: number } | null,
    direction: "down" as Direction,
    faceRight: true,
    frame: 0,
    lastFrameAt: 0,
    lastEmitAt: 0,
    initialized: fieldSize.width > 0 && fieldSize.height > 0,
  });

  const [view, setView] = useState<LocalMovementState>({
    x: stateRef.current.x,
    y: stateRef.current.y,
    direction: stateRef.current.direction,
    animation: "idle",
    frame: 0,
    faceRight: true,
  });

  // 레이아웃 측정이 늦게 끝나는 경우, 필드 크기를 처음 알게 된 시점에 배치한다
  useEffect(() => {
    const s = stateRef.current;
    if (!s.initialized && fieldSize.width > 0 && fieldSize.height > 0) {
      const start = clampToField(fieldSize.width / 2, fieldSize.height * 0.85, fieldSize, charSizeRef.current);
      s.x = start.x;
      s.y = start.y;
      s.initialized = true;
      setView((v) => ({ ...v, x: s.x, y: s.y }));
    }
  }, [fieldSize.width, fieldSize.height]);

  const emit = useCallback((direction: Direction) => {
    const s = stateRef.current;
    const { width, height } = boundsRef.current;
    if (width <= 0 || height <= 0) return;
    getSocket().emit("player:sync_move", {
      x: s.x / width,
      y: s.y / height,
      direction,
    });
  }, []);

  const moveTo = useCallback((px: number, py: number) => {
    stateRef.current.target = clampToField(px, py, boundsRef.current, charSizeRef.current);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current;
      const now = Date.now();
      let animation: "walk" | "idle" = "idle";

      if (s.target) {
        const dx = s.target.x - s.x;
        const dy = s.target.y - s.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= ARRIVE_EPSILON_PX) {
          s.x = s.target.x;
          s.y = s.target.y;
          s.target = null;
          emit(s.direction);
          s.lastEmitAt = now;
        } else {
          const step = Math.min(STEP_PX_PER_TICK, dist);
          s.x += (dx / dist) * step;
          s.y += (dy / dist) * step;
          animation = "walk";

          // 스프라이트가 좌우 반전만 지원해서, 더 크게 움직이는 축으로 방향을 정한다
          if (Math.abs(dx) >= Math.abs(dy)) {
            s.direction = dx >= 0 ? "right" : "left";
            s.faceRight = dx >= 0;
          } else {
            s.direction = dy >= 0 ? "down" : "up";
          }

          if (now - s.lastEmitAt >= MOVE_EMIT_INTERVAL_MS) {
            emit(s.direction);
            s.lastEmitAt = now;
          }
        }
      } else if (now - s.lastEmitAt >= HEARTBEAT_INTERVAL_MS) {
        emit(s.direction);
        s.lastEmitAt = now;
      }

      const frameIntervalMs = animation === "walk" ? WALK_FRAME_INTERVAL_MS : IDLE_FRAME_INTERVAL_MS;
      if (now - s.lastFrameAt >= frameIntervalMs) {
        s.frame = (s.frame + 1) % CAT_FRAME_COUNT;
        s.lastFrameAt = now;
      }

      setView({
        x: s.x,
        y: s.y,
        direction: s.direction,
        animation,
        frame: s.frame,
        faceRight: s.faceRight,
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [emit]);

  return { ...view, moveTo };
}
