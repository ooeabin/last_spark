import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useLoungeConnection } from "@/features/lounge-matching";
import { useGameStateStore, DevBatteryControls } from "@/features/battery-tracking";
import { BatteryStatusBar } from "@/widgets/status-bar";
import { AppText, Card, ScreenContainer } from "@/shared/ui";
import { colors, radius, spacing } from "@/shared/theme/tokens";

/** B. 라운지 진입 (기획서 2.2, 4.2) — 배터리 ≤10% AND 미충전 */
export function LoungeScreen() {
  const { t } = useTranslation();
  const batteryLevel = useGameStateStore((s) => s.batteryLevel);
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

        {/*
          라운지 씬(2D 패럴랙스 배경 + 도트 캐릭터, 기획서 2.1.1) 자리.
          react-native-skia로 배경 이미지 + 캐릭터 스프라이트를 합성
          렌더링할 예정이나, Higgsfield/PixelLab 에셋이 아직 없어
          스타터 단계에서는 자리만 잡아둔다.
        */}
        <Card
          elevated
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
            borderRadius: radius.dialog,
          }}
        >
          <AppText variant="caption" color={colors.borderLight}>
            {t("lounge.scenePending")}
          </AppText>
        </Card>

        <DevBatteryControls />
      </View>
    </ScreenContainer>
  );
}
