/**
 * 서버 측 배터리 변화율 검증 (기획서 8장 "부정 사용 가능성", 9.2 "부정사용 방지").
 *
 * 실제 배터리는 급격히 오르내리지 않는다. 짧은 시간 내 비정상적인
 * 배터리 변화(예: 1초 만에 50% 하락, 또는 미충전인데 갑자기 충전 중으로
 * 잔량이 튀어오름)를 감지하는 최소한의 휴리스틱만 구현한다 — 완전한
 * 부정사용 방지는 아니고, 명백히 조작된 값만 걸러낸다.
 */

interface BatteryHistoryEntry {
  level: number;
  timestampMs: number;
}

const MAX_DROP_PERCENT_PER_SEC = 5; // 정상적인 방전 속도를 크게 상회하는 임계값
const history = new Map<string, BatteryHistoryEntry>();

export function isSuspiciousBatteryChange(
  playerId: string,
  newLevel: number,
  nowMs: number
): boolean {
  const prev = history.get(playerId);
  history.set(playerId, { level: newLevel, timestampMs: nowMs });

  if (!prev) return false;

  const elapsedSec = Math.max(0.001, (nowMs - prev.timestampMs) / 1000);
  const dropPerSec = (prev.level - newLevel) / elapsedSec;

  return dropPerSec > MAX_DROP_PERCENT_PER_SEC;
}

export function clearBatteryHistory(playerId: string) {
  history.delete(playerId);
}
