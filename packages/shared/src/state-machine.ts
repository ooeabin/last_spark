/**
 * 전체 상태 머신 (기획서 2.2)
 *
 * A. WAITING     — 배터리 > 10% 또는 충전 중
 * B. LOUNGE      — 배터리 ≤10% AND 미충전 (국가별 라운지 자동 매칭)
 * C. EMERGENCY   — 라운지 체류 중 충전기 연결 (10초 카운트다운)
 * D. LAST_RITES  — 배터리 1% (방전 제단 접근 가능)
 * E. DEAD        — 배터리 0% 또는 앱 종료 (묘비 생성)
 *
 * 이 파일이 상태머신의 단일 소스다. mobile의 zustand 스토어와 server의
 * 룸 상태 검증 로직이 둘 다 이 타입/전이표를 참조해야 한다.
 */

export const GAME_STATES = [
  "WAITING",
  "LOUNGE",
  "EMERGENCY",
  "LAST_RITES",
  "DEAD",
] as const;

export type GameState = (typeof GAME_STATES)[number];

/** 배터리 구간별 시각 효과 단계 (기획서 4.2-A) */
export const BATTERY_TIERS = [
  { min: 6, max: 10, id: "stable", speedMultiplier: 1.0 },
  { min: 3, max: 5, id: "caution", speedMultiplier: 0.8 },
  { min: 1, max: 2, id: "dying", speedMultiplier: 0.55 },
] as const;

export type BatteryTierId = (typeof BATTERY_TIERS)[number]["id"];

export function getBatteryTier(level: number) {
  return BATTERY_TIERS.find((t) => level >= t.min && level <= t.max) ?? null;
}

/**
 * 상태 전이 규칙 (기획서 2.2 "전이" 컬럼 그대로).
 * evaluateNextState()는 mobile 스토어와 server 검증 로직 양쪽에서
 * 동일한 판정을 내리기 위한 순수 함수 — 부수효과 없음.
 */
export interface StateMachineInput {
  current: GameState;
  batteryLevel: number; // 0-100
  isCharging: boolean;
  emergencyTimerExpired?: boolean; // C 상태에서 10초 경과 여부
  emergencyDetached?: boolean; // C 상태에서 충전기 분리 여부
  graceGranted?: boolean; // D 상태에서 보상형 광고로 3분 유예 획득 여부
  entryRequested?: boolean; // A 상태에서 유저가 "입장"을 눌렀는지 여부
}

/**
 * A(WAITING)에서 라운지 입장이 가능한 조건 — 기획서 2.2의 B 진입 조건과 동일하다.
 *
 * 전이 자체(evaluateNextState)와 분리해 둔 이유: 대기 화면은 조건을 만족해도
 * 곧바로 넘어가지 않고 "입장 가능" 상태를 보여준 뒤 유저가 직접 입장하기
 * 때문에, UI가 "지금 입장할 수 있는가"를 전이와 별개로 물어봐야 한다.
 * 조건이 두 군데로 갈라지지 않도록 evaluateNextState도 이 함수를 쓴다.
 */
export function canEnterLounge(batteryLevel: number, isCharging: boolean): boolean {
  return batteryLevel <= 10 && !isCharging;
}

export function evaluateNextState(input: StateMachineInput): GameState {
  const { current, batteryLevel, isCharging } = input;

  switch (current) {
    case "WAITING":
      // 조건을 만족해도 자동 입장하지 않는다 — 대기 화면에서 "입장 가능"을
      // 보여주고, 유저가 직접 입장을 눌렀을 때만(entryRequested) 넘어간다.
      if (canEnterLounge(batteryLevel, isCharging) && input.entryRequested) return "LOUNGE";
      return "WAITING";

    case "LOUNGE":
      if (batteryLevel <= 0) return "DEAD";
      if (isCharging) return "EMERGENCY";
      // LAST_RITES는 배터리 1%일 때 "제단 접근 권한"이 열리는 것이지
      // 화면 자체가 강제 전환되는 건 아니다. 다만 스타터 구현에서는
      // 단순화를 위해 1% 진입 시 LAST_RITES로 전환한다.
      if (batteryLevel <= 1) return "LAST_RITES";
      if (batteryLevel > 10) return "WAITING";
      return "LOUNGE";

    case "EMERGENCY":
      if (input.emergencyDetached) return "LOUNGE";
      if (input.emergencyTimerExpired) return "DEAD"; // 낙뢰 처형 → 세션 강제 종료
      return "EMERGENCY";

    case "LAST_RITES":
      if (batteryLevel <= 0) return "DEAD";
      if (input.graceGranted) return "LOUNGE";
      if (isCharging) return "EMERGENCY";
      return "LAST_RITES";

    case "DEAD":
      return "WAITING"; // 묘비 생성 후 대기 화면 복귀

    default:
      return current;
  }
}
