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
}

export function evaluateNextState(input: StateMachineInput): GameState {
  const { current, batteryLevel, isCharging } = input;

  switch (current) {
    case "WAITING":
      if (batteryLevel <= 10 && !isCharging) return "LOUNGE";
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
