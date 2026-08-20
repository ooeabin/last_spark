import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useEmergencyCountdown } from "@/features/emergency-countdown";
import { AppText, Button, ScreenContainer } from "@/shared/ui";
import { colors, spacing } from "@/shared/theme/tokens";

/** C. 비상 카운트다운 (기획서 2.2, 4.2-D) — 충전기 연결 감지, 10초 */
export function EmergencyScreen() {
  const { t } = useTranslation();
  const { secondsLeft, detach } = useEmergencyCountdown();

  return (
    <ScreenContainer style={{ backgroundColor: "#2a0d10" }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg }}>
        <AppText variant="sectionTitle" color={colors.negative}>
          {t("emergency.title")}
        </AppText>
        <AppText variant="body" color={colors.negative}>
          {t("emergency.timerLabel", { seconds: secondsLeft ?? 10 })}
        </AppText>
        <Button label={t("emergency.detachCta")} variant="primary" onPress={detach} />
      </View>
    </ScreenContainer>
  );
}
