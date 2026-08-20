import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { getBatteryTier } from "@last-spark/shared";
import { AppText } from "@/shared/ui";
import { colors, radius, spacing } from "@/shared/theme/tokens";

interface Props {
  batteryLevel: number;
  mode: "waiting" | "lounge";
}

const TIER_COLOR: Record<string, string> = {
  stable: colors.accent,
  caution: colors.warning,
  dying: colors.negative,
};

/** 기획서 4.1(대기) / 4.2-A(라운지 구간별 시각효과) 공통 배터리 상태 표시 */
export function BatteryStatusBar({ batteryLevel, mode }: Props) {
  const { t } = useTranslation();
  const tier = getBatteryTier(batteryLevel);
  const tierColor = tier ? TIER_COLOR[tier.id] : colors.textSecondary;

  return (
    <View
      style={{
        borderRadius: radius.fullPill,
        backgroundColor: colors.surfaceAlt,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.lg,
        alignSelf: "flex-start",
      }}
    >
      <AppText variant="caption" color={tierColor}>
        {t("waiting.batteryLabel", { level: batteryLevel })}
        {mode === "waiting" && batteryLevel > 10
          ? ` · ${t("waiting.enterIn", { percent: batteryLevel - 10 })}`
          : ""}
      </AppText>
    </View>
  );
}
