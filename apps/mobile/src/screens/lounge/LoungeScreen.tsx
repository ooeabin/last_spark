import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useLoungeConnection } from "@/features/lounge-matching";
import { useGameStateStore, DevBatteryControls } from "@/features/battery-tracking";
import { BatteryStatusBar } from "@/widgets/status-bar";
import { usePlayerIdentity } from "@/entities/player";
import { AppText, ScreenContainer } from "@/shared/ui";
import { colors, spacing } from "@/shared/theme/tokens";
import { LoungeScene } from "./ui/LoungeScene";

/** B. 라운지 진입 (기획서 2.2, 4.2) — 배터리 ≤10% AND 미충전 */
export function LoungeScreen() {
  const { t } = useTranslation();
  const batteryLevel = useGameStateStore((s) => s.batteryLevel);
  const charId = usePlayerIdentity((s) => s.charId);
  const nickname = usePlayerIdentity((s) => s.nickname);
  const { room } = useLoungeConnection();

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.sm, flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <BatteryStatusBar batteryLevel={batteryLevel} />
          <AppText variant="small" color={colors.textSecondary}>
            {room ? `${room.roomId} · ${room.occupants}/${room.capacity}` : t("lounge.connecting")}
          </AppText>
        </View>

        {/* 라운지 씬: 2D 패럴랙스 배경 + 도트 캐릭터 (기획서 2.1.1) */}
        <LoungeScene charId={charId} nickname={nickname} />

        <DevBatteryControls />
      </View>
    </ScreenContainer>
  );
}
