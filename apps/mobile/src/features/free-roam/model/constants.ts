/** 자유 이동 시뮬레이션 튜닝 값 (기획서 2.1.1 — 라운지 전 영역 배회) */

export const TICK_MS = 60;
export const STEP_PX_PER_TICK = 4.5;
export const ARRIVE_EPSILON_PX = 3;

/** 소켓으로 위치를 쏘는 최소 간격 — 이동 중에도 매 틱 쏘지 않는다 */
export const MOVE_EMIT_INTERVAL_MS = 150;
/** 가만히 있어도 이 주기로 한 번씩 쏴서 다른 클라이언트가 나를 stale로 지우지 않게 한다 */
export const HEARTBEAT_INTERVAL_MS = 3000;
/** 이 시간 동안 갱신이 없으면 원격 플레이어를 화면에서 지운다 (연결 끊김 등 player:left를 놓친 경우 대비) */
export const REMOTE_STALE_MS = 8000;

export const WALK_FRAME_INTERVAL_MS = 90;
export const IDLE_FRAME_INTERVAL_MS = 220;
