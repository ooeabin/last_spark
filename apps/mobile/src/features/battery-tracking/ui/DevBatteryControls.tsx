import React from "react";
import { StyleSheet, Switch, View } from "react-native";
import { useGameStateStore } from "../model/gameStateStore";
import { AppText, Button } from "@/shared/ui";
import { colors, spacing } from "@/shared/theme/tokens";

/**
 * __DEV__ 전용 개발자 컨트롤 — 실기기 없이 배터리 잔량/충전 상태를
 * 강제로 바꿔가며 상태머신(A~E) 전이를 눈으로 확인할 수 있다.
 * 프로덕션 빌드에는 렌더링되지 않는다.
 */
export function DevBatteryControls() {
  // 훅은 항상 같은 순서로 호출해야 하므로(Rules of Hooks) __DEV__ 체크보다 먼저 둔다.
  // 프로덕션 빌드에서는 __DEV__ 블록 자체가 번들에서 제거되므로 비용은 없다.
  const batteryLevel = useGameStateStore((s) => s.batteryLevel);
  const isCharging = useGameStateStore((s) => s.isCharging);
  const gameState = useGameStateStore((s) => s.gameState);
  const setBatteryLevel = useGameStateStore((s) => s.setBatteryLevel);
  const setCharging = useGameStateStore((s) => s.setCharging);

  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <AppText variant="smallBold">DEV — state: {gameState}</AppText>
      <View style={styles.row}>
        <AppText variant="small">배터리 {batteryLevel}%</AppText>
        <Switch value={isCharging} onValueChange={setCharging} />
        <AppText variant="small">충전중</AppText>
      </View>
      <View style={styles.row}>
        <Button label="-1%" variant="outline" onPress={() => setBatteryLevel(batteryLevel - 1)} />
        <Button label="+1%" variant="outline" onPress={() => setBatteryLevel(batteryLevel + 1)} />
        <Button label="0%로" variant="outline" onPress={() => setBatteryLevel(0)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
