import { create } from "zustand";
import { evaluateNextState, type GameState } from "@last-spark/shared";

interface GameStateStore {
  gameState: GameState;
  batteryLevel: number; // 0-100
  isCharging: boolean;
  /**
   * 제단에서 유언을 작성하는 동안에는 배터리 드레인/상태 전이를 멈춘다.
   * 이게 없으면 작성 도중 방전 전이가 일어나 화면이 바뀌면서 입력하던
   * 유언이 그대로 사라진다.
   */
  altarOpen: boolean;

  setBatteryLevel: (level: number) => void;
  setCharging: (charging: boolean) => void;
  /** 대기 화면(A)에서 유저가 직접 "입장"을 눌렀을 때 라운지로 전이 */
  enterLounge: () => void;
  openAltar: () => void;
  closeAltar: () => void;
  /** 서버로부터 traitor:execute 수신 시 즉시 DEAD로 강제 전이 */
  forceExecuted: () => void;
  /** 서버로부터 emergency:cancel 수신 시 LOUNGE로 복귀 */
  emergencyDetached: () => void;
  /** 보상형 광고 시청으로 3분 유예 획득(D → B) */
  grantGrace: () => void;
  /** 사망 처리 이후 대기 화면 복귀 시 배터리를 임의로 재충전 상태로 리셋(데모용) */
  resetAfterDeath: (nextBatteryLevel?: number) => void;
}

export const useGameStateStore = create<GameStateStore>((set, get) => ({
  gameState: "WAITING",
  batteryLevel: 15,
  isCharging: false,
  altarOpen: false,

  setBatteryLevel: (level) => {
    const clamped = Math.max(0, Math.min(100, level));
    const { altarOpen, gameState, isCharging } = get();
    if (altarOpen) {
      // 제단이 열려있는 동안엔 수치만 갱신하고 상태 전이는 보류한다.
      set({ batteryLevel: clamped });
      return;
    }
    const next = evaluateNextState({ current: gameState, batteryLevel: clamped, isCharging });
    set({ batteryLevel: clamped, gameState: next });
  },

  setCharging: (charging) => {
    const { gameState, batteryLevel } = get();
    const next = evaluateNextState({ current: gameState, batteryLevel, isCharging: charging });
    set({ isCharging: charging, gameState: next });
  },

  enterLounge: () => {
    const { gameState, batteryLevel, isCharging } = get();
    const next = evaluateNextState({
      current: gameState,
      batteryLevel,
      isCharging,
      entryRequested: true,
    });
    set({ gameState: next });
  },

  openAltar: () => set({ altarOpen: true }),
  closeAltar: () => {
    // 제단을 닫는 순간 보류됐던 상태 전이를 다시 평가한다(배터리가 그새 0이 됐을 수 있음).
    const { gameState, batteryLevel, isCharging } = get();
    const next = evaluateNextState({ current: gameState, batteryLevel, isCharging });
    set({ altarOpen: false, gameState: next });
  },

  forceExecuted: () => {
    const { gameState, batteryLevel, isCharging } = get();
    const next = evaluateNextState({
      current: gameState,
      batteryLevel,
      isCharging,
      emergencyTimerExpired: true,
    });
    set({ gameState: next });
  },

  emergencyDetached: () => {
    const { gameState, batteryLevel } = get();
    const next = evaluateNextState({
      current: gameState,
      batteryLevel,
      isCharging: false,
      emergencyDetached: true,
    });
    set({ isCharging: false, gameState: next });
  },

  grantGrace: () => {
    const { gameState, batteryLevel } = get();
    const next = evaluateNextState({
      current: gameState,
      batteryLevel,
      isCharging: false,
      graceGranted: true,
    });
    set({ gameState: next });
  },

  resetAfterDeath: (nextBatteryLevel = 100) => {
    set({ gameState: "WAITING", batteryLevel: nextBatteryLevel, isCharging: true, altarOpen: false });
  },
}));
