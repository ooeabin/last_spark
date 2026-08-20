import React from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useGameStateStore, DevBatteryControls } from "@/features/battery-tracking";
import { detectCountryCode } from "@/entities/room";
import { BatteryStatusBar } from "@/widgets/status-bar";
import { LeaderboardBanner } from "@/widgets/leaderboard-banner";
import { GravestoneGallery } from "@/widgets/gravestone-gallery";
import { AppText, ScreenContainer } from "@/shared/ui";
import { spacing } from "@/shared/theme/tokens";

/** A. 대기 모드 (기획서 2.2, 4.1) — 배터리 > 10% 또는 충전 중 */
export function WaitingScreen() {
  const { t } = useTranslation();
  const batteryLevel = useGameStateStore((s) => s.batteryLevel);
  const countryCode = detectCountryCode();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: spacing.lg }}>
        <View>
          <AppText variant="sectionTitle">{t("common.appName")}</AppText>
          <AppText variant="caption" color="#b3b3b3">
            {t("common.slogan")}
          </AppText>
        </View>

        <BatteryStatusBar batteryLevel={batteryLevel} mode="waiting" />
        <LeaderboardBanner />
        <GravestoneGallery countryCode={countryCode} />

        <DevBatteryControls />
      </ScrollView>
    </ScreenContainer>
  );
}
