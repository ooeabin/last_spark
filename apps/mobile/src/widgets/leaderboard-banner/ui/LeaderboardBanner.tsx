import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "@/shared/ui";
import { colors, radius, spacing } from "@/shared/theme/tokens";

interface Props {
  /** "명예의 전당 전광판" 아이템을 구매한 유저의 유언(기획서 6장) — 없으면 슬로건으로 대체 */
  featuredMessage?: string;
}

/** 상단 전광판 (기획서 4.1) — 24시간 고정 롤링 노출 배너 */
export function LeaderboardBanner({ featuredMessage }: Props) {
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.card,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
      }}
    >
      <AppText variant="small" color={colors.accent}>
        {t("waiting.hallOfFameTitle")}
      </AppText>
      <AppText variant="caption" numberOfLines={1}>
        {featuredMessage ?? t("common.slogan")}
      </AppText>
    </View>
  );
}
