import { useEffect } from "react";
import * as Battery from "expo-battery";
import { useGameStateStore } from "./gameStateStore";

/**
 * 실기기 배터리 센서 연동 (기획서 9.1 `expo-battery`).
 *
 * 프로토타입 개발 중 헤드리스 브라우저 환경에서 `navigator.getBattery()`가
 * charging:true를 무조건 반환해 개발용 슬라이더 값을 덮어써버리는 문제를
 * 겪은 적이 있다(웹 Battery API 한정 이슈). expo-battery 네이티브 모듈은
 * 같은 문제가 보고되진 않지만, 혹시 시뮬레이터/에뮬레이터에서 유사하게
 * 부정확한 값을 주는 경우를 대비해 __DEV__ 빌드에서는
 * `features/battery-tracking/ui/DevBatteryControls`로 수동 오버라이드가
 * 가능하게 해뒀다 — 실기기 프로덕션 빌드에서는 이 훅의 실측값만 쓰인다.
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
