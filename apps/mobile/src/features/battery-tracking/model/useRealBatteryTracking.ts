import { useEffect } from "react";
import * as Battery from "expo-battery";
import { useGameStateStore } from "./gameStateStore";

/**
 * 실기기 배터리 센서 연동 (기획서 9.1 `expo-battery`).
 *
 * 시뮬레이터/에뮬레이터에는 배터리 센서가 없어 실측값이 부정확하거나 고정될
 * 수 있으므로, `__DEV__` 빌드에서는 `ui/DevBatteryControls`로 수동
 * 오버라이드가 가능하다. 실기기 프로덕션 빌드에서는 이 훅의 실측값만 쓰인다.
 */
export function useRealBatteryTracking() {
  const setBatteryLevel = useGameStateStore((s) => s.setBatteryLevel);
  const setCharging = useGameStateStore((s) => s.setCharging);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [level, state] = await Promise.all([
        Battery.getBatteryLevelAsync(),
        Battery.getBatteryStateAsync(),
      ]);
      if (!mounted) return;
      setBatteryLevel(Math.round(level * 100));
      setCharging(
        state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL
      );
    })();

    const levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setBatteryLevel(Math.round(batteryLevel * 100));
    });
    const stateSub = Battery.addBatteryStateListener(({ batteryState }) => {
      setCharging(
        batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL
      );
    });

    return () => {
      mounted = false;
      levelSub.remove();
      stateSub.remove();
    };
  }, [setBatteryLevel, setCharging]);
}
