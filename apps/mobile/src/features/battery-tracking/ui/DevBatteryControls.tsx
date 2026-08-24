import React, { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { useGameStateStore } from "../model/gameStateStore";
import { AppText, Button } from "@/shared/ui";
import { colors, radius, spacing } from "@/shared/theme/tokens";

/**
 * __DEV__ 전용 개발자 컨트롤 — 실기기 없이 배터리 잔량/충전 상태를
 * 강제로 바꿔가며 상태머신(A~E) 전이를 눈으로 확인할 수 있다.
 * 프로덕션 빌드에는 렌더링되지 않는다.
 *
 * 화면 구성을 가리지 않도록 평소에는 버튼 하나로 접혀 있고, 누르면 펼쳐진다.
 */
export function DevBatteryControls() {
  // 훅은 항상 같은 순서로 호출해야 하므로(Rules of Hooks) __DEV__ 체크보다 먼저 둔다.
  // 프로덕션 빌드에서는 __DEV__ 블록 자체가 번들에서 제거되므로 비용은 없다.
  const [open, setOpen] = useState(false);
  const batteryLevel = useGameStateStore((s) => s.batteryLevel);
  const isCharging = useGameStateStore((s) => s.isCharging);
  const gameState = useGameStateStore((s) => s.gameState);
  const setBatteryLevel = useGameStateStore((s) => s.setBatteryLevel);
  const setCharging = useGameStateStore((s) => s.setCharging);

  if (!__DEV__) return null;

  return (
    <View style={styles.wrap}>
      <Button
        label={open ? "DEV ✕" : "DEV"}
        variant="outline"
        onPress={() => setOpen((v) => !v)}
        accessibilityLabel={open ? "개발자 컨트롤 닫기" : "개발자 컨트롤 열기"}
        style={styles.toggle}
      />

      {open && (
        <View style={styles.panel}>
          <AppText variant="small" color={colors.textSecondary}>
            {gameState} · {batteryLevel}%
          </AppText>
          <View style={styles.row}>
            <Button label="-1%" variant="outline" onPress={() => setBatteryLevel(batteryLevel - 1)} />
            <Button label="+1%" variant="outline" onPress={() => setBatteryLevel(batteryLevel + 1)} />
            <Button label="0%" variant="outline" onPress={() => setBatteryLevel(0)} />
          </View>
          <View style={styles.row}>
            <Switch value={isCharging} onValueChange={setCharging} accessibilityLabel="충전 상태" />
            <AppText variant="small" color={colors.textSecondary}>
              충전
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // 바깥 여백은 두지 않는다 — 어디에 놓을지는 배치하는 화면이 정한다.
  wrap: { alignItems: "flex-end" },
  toggle: { paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm },
  /**
   * 펼친 패널은 레이아웃에서 빼내 화면 위에 띄운다 — 흐름에 두면 열 때마다
   * 아래 콘텐츠가 통째로 밀려 내려가 화면 구성이 흔들린다.
   */
  panel: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: spacing.xs,
    zIndex: 20,
    elevation: 20, // Android
    minWidth: 200,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.warning,
    borderRadius: radius.card,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
