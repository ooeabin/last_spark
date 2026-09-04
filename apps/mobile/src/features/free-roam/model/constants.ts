/** 자유 이동 시뮬레이션 튜닝 값 (기획서 2.1.1 — 라운지 전 영역 배회) */

/**
 * 월드(맵) 크기 — 화면(pt)보다 넓고, 카메라가 내 캐릭터를 따라 스크롤한다.
 * 위치 동기화의 정규화(0~1) 기준이자 배경 에셋의 논리 크기이므로,
 * 바꾸면 assets/generate-placeholders.py의 LOGICAL_W/H도 같이 맞춰야 한다.
 */
export const WORLD_WIDTH = 1440;
export const WORLD_HEIGHT = 2160;

/**
 * 맵은 문으로 이어진 4개 구역이다 (기획서 3.1): 잿불 홀(hall)·바 카운터(bar)·
 * 휴게 라운지(rest)·추모실(memorial). 벽/문 좌표는 배경을 그리는
 * assets/generate-placeholders.py의 레이아웃 상수에서 나온 값이라, 맵 구조를
 * 바꾸면 두 파일을 같이 고쳐야 한다.
 */
export type RoomKey = "hall" | "bar" | "rest" | "memorial";

/** 상단 외벽 아래 첫 걸을 수 있는 y (벽 위로 못 올라가게) */
export const FLOOR_TOP = 360;

export interface WallRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 이동을 막는 인테리어 벽 (문 구간은 비어 있다) */
export const WALLS: WallRect[] = [
  { x: 706, y: 340, w: 28, h: 260 }, // 홀|바 세로벽 위쪽 (문: y 600~780)
  { x: 706, y: 780, w: 28, h: 300 }, // 홀|바 세로벽 아래쪽
  { x: 0, y: 1080, w: 260, h: 90 }, // 가로벽 왼쪽 (문: x 260~440)
  { x: 440, y: 1080, w: 560, h: 90 }, // 가로벽 중앙 (문: x 1000~1180)
  { x: 1180, y: 1080, w: 260, h: 90 }, // 가로벽 오른쪽
  { x: 706, y: 1170, w: 28, h: 350 }, // 휴게|추모 세로벽 위쪽 (문: y 1520~1700)
  { x: 706, y: 1700, w: 28, h: 460 }, // 휴게|추모 세로벽 아래쪽
];

/** 발밑 앵커가 어느 구역에 있는지 — 구역 전환 배너 표시용 */
export function getRoomAt(x: number, y: number): RoomKey {
  const bottom = y >= 1125; // 가로벽 중심선
  const right = x >= 720; // 세로벽 중심선
  if (bottom) return right ? "memorial" : "rest";
  return right ? "bar" : "hall";
}

export const TICK_MS = 60;
/** 조이스틱을 끝까지 밀었을 때 틱당 이동량 (≈217pt/s) */
export const MAX_STEP_PX_PER_TICK = 13;
/** 이 크기 미만의 조이스틱 입력은 손떨림으로 보고 무시한다 */
export const JOYSTICK_DEADZONE = 0.12;

/** 소켓으로 위치를 쏘는 최소 간격 — 이동 중에도 매 틱 쏘지 않는다 */
export const MOVE_EMIT_INTERVAL_MS = 150;
/** 가만히 있어도 이 주기로 한 번씩 쏴서 다른 클라이언트가 나를 stale로 지우지 않게 한다 */
export const HEARTBEAT_INTERVAL_MS = 3000;
/** 이 시간 동안 갱신이 없으면 원격 플레이어를 화면에서 지운다 (연결 끊김 등 player:left를 놓친 경우 대비) */
export const REMOTE_STALE_MS = 8000;

export const WALK_FRAME_INTERVAL_MS = 90;
export const IDLE_FRAME_INTERVAL_MS = 220;
