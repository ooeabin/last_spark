import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/shared/api/socketClient";
import type { PlayerSyncMovePayload } from "@last-spark/shared";
import { CAT_FRAME_COUNT } from "@/entities/player";
import {
  TICK_MS,
  MAX_STEP_PX_PER_TICK,
  JOYSTICK_DEADZONE,
  MOVE_EMIT_INTERVAL_MS,
  HEARTBEAT_INTERVAL_MS,
  WALK_FRAME_INTERVAL_MS,
  IDLE_FRAME_INTERVAL_MS,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  FLOOR_TOP,
  WALLS,
} from "./constants";

type Direction = PlayerSyncMovePayload["direction"];

interface CharSize {
  width: number;
  height: number;
}

export interface LocalMovementState {
  /** 월드 좌표(pt) — 화면 좌표는 씬이 카메라 오프셋을 빼서 만든다 */
  x: number;
  y: number;
  direction: Direction;
  animation: "walk" | "idle";
  frame: number;
  faceRight: boolean;
}

/**
 * 내 캐릭터의 자유 이동 시뮬레이션 (기획서 2.1.1 — 라운지 전 영역 배회, 어몽어스식 조작).
 *
 * 가상 조이스틱이 넘겨주는 방향 벡터(setVelocity)를 매 틱 적분해서 월드 좌표를
 * 움직이고, 이동 중에는 socket으로 player:sync_move를 던진다(스로틀). 정지 중에도
 * 일정 주기로 한 번씩 쏘는 이유는 다른 클라이언트가 나를 "연결 끊김"으로 오인해
 * 지우지 않게 하기 위한 하트비트다 — 서버가 player:left를 확실히 보장하지 못하는
 * 경우(네트워크 끊김 등) 대비다.
 */
// (x, y)는 캐릭터의 "발밑" 앵커 좌표다 — 렌더링 쪽(PlayerAvatar)이 top = y - height로
// 그리는 것과 맞춰야 해서, 세로 클램프는 half가 아니라 캐릭터 전체 높이를 기준으로 한다.
// 세로 하한이 char.height가 아니라 FLOOR_TOP인 이유: 상단 외벽 위로 못 올라가게.
function clampToWorld(px: number, py: number, char: CharSize) {
  const halfW = char.width / 2;
  const x = Math.min(Math.max(px, halfW), WORLD_WIDTH - halfW);
  const y = Math.min(Math.max(py, Math.max(char.height, FLOOR_TOP)), WORLD_HEIGHT);
  return { x, y };
}

/** 발밑 앵커가 벽에 파고들지 않게 하는 여유 폭 */
const WALL_MARGIN = 14;

function isBlocked(px: number, py: number) {
  return WALLS.some(
    (w) =>
      px > w.x - WALL_MARGIN &&
      px < w.x + w.w + WALL_MARGIN &&
      py > w.y - 4 && // 위에서 접근할 땐 몸이 벽 앞에 겹쳐 보여도 자연스러워 여유를 적게 둔다
      py < w.y + w.h + WALL_MARGIN,
  );
}

/**
 * 벽에 부딪히면 축별로 나눠 미끄러진다 — 대각선으로 벽에 밀어붙였을 때
 * 완전히 멈추는 대신 벽을 따라 걷게 하기 위해서다 (어몽어스와 같은 조작감).
 */
function resolveMove(sx: number, sy: number, dx: number, dy: number, char: CharSize) {
  const full = clampToWorld(sx + dx, sy + dy, char);
  if (!isBlocked(full.x, full.y)) return full;
  const xOnly = clampToWorld(sx + dx, sy, char);
  if (dx !== 0 && !isBlocked(xOnly.x, xOnly.y)) return { x: xOnly.x, y: sy };
  const yOnly = clampToWorld(sx, sy + dy, char);
  if (dy !== 0 && !isBlocked(yOnly.x, yOnly.y)) return { x: sx, y: yOnly.y };
  return { x: sx, y: sy };
}

export function useLocalMovement(charSize: CharSize) {
  const charSizeRef = useRef(charSize);
  charSizeRef.current = charSize;

  const stateRef = useRef({
    // 시작 위치: 잿불 홀 러그 위 (구역 레이아웃은 constants.ts WALLS 참고)
    x: WORLD_WIDTH * 0.25,
    y: WORLD_HEIGHT * 0.42,
    vx: 0,
    vy: 0,
    wasMoving: false,
    direction: "down" as Direction,
    faceRight: true,
    frame: 0,
    lastFrameAt: 0,
    lastEmitAt: 0,
  });

  const [view, setView] = useState<LocalMovementState>({
    x: stateRef.current.x,
    y: stateRef.current.y,
    direction: stateRef.current.direction,
    animation: "idle",
    frame: 0,
    faceRight: true,
  });

  const emit = useCallback((direction: Direction) => {
    const s = stateRef.current;
    getSocket().emit("player:sync_move", {
      x: s.x / WORLD_WIDTH,
      y: s.y / WORLD_HEIGHT,
      direction,
    });
  }, []);

  /** 조이스틱 방향 벡터(-1~1). 크기가 속도가 된다 — 살짝 밀면 천천히 걷는다. */
  const setVelocity = useCallback((nx: number, ny: number) => {
    stateRef.current.vx = nx;
    stateRef.current.vy = ny;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current;
      const now = Date.now();
      let animation: "walk" | "idle" = "idle";

      const mag = Math.hypot(s.vx, s.vy);
      if (mag > JOYSTICK_DEADZONE) {
        const step = MAX_STEP_PX_PER_TICK * Math.min(1, mag);
        const next = resolveMove(s.x, s.y, (s.vx / mag) * step, (s.vy / mag) * step, charSizeRef.current);
        s.x = next.x;
        s.y = next.y;
        animation = "walk";
        s.wasMoving = true;

        // 스프라이트가 좌우 반전만 지원해서, 더 크게 미는 축으로 방향을 정한다
        if (Math.abs(s.vx) >= Math.abs(s.vy)) {
          s.direction = s.vx >= 0 ? "right" : "left";
          s.faceRight = s.vx >= 0;
        } else {
          s.direction = s.vy >= 0 ? "down" : "up";
        }

        if (now - s.lastEmitAt >= MOVE_EMIT_INTERVAL_MS) {
          emit(s.direction);
          s.lastEmitAt = now;
        }
      } else if (s.wasMoving) {
        // 멈춘 순간 최종 위치를 한 번 확정 전송 (스로틀 사이에 낀 마지막 이동분 보정)
        s.wasMoving = false;
        emit(s.direction);
        s.lastEmitAt = now;
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

  return { ...view, setVelocity };
}
