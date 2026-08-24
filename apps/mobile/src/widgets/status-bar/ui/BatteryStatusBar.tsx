import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { getBatteryTier } from "@last-spark/shared";
import { AppText } from "@/shared/ui";
import { colors, radius, spacing } from "@/shared/theme/tokens";

interface Props {
  batteryLevel: number;
}

const TIER_COLOR: Record<string, string> = {
  stable: colors.accent,
  caution: colors.warning,
  dying: colors.negative,
};

/** 라운지 배터리 표시 (기획서 4.2-A 구간별 시각효과) — 잔량이 곧 남은 시간이다 */
export function BatteryStatusBar({ batteryLevel }: Props) {
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
      </AppText>
    </View>
  );
}
