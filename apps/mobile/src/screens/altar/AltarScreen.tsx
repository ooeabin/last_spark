import React from "react";
import { TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAltar } from "@/features/altar-broadcast";
import { useRewardedAd } from "@/features/rewarded-ad";
import { useGameStateStore, DevBatteryControls } from "@/features/battery-tracking";
import { AppText, Button, ScreenContainer } from "@/shared/ui";
import { colors, radius, spacing } from "@/shared/theme/tokens";

/** D. 1% 임종 모드 (기획서 2.2, 4.2-C) — 방전 제단 */
export function AltarScreen() {
  const { t } = useTranslation();
  const { message, setMessage, submit, banner, maxLength } = useAltar();
  const { watchAd, isLoading } = useRewardedAd();
  const grantGrace = useGameStateStore((s) => s.grantGrace);

  const handleWatchAd = async () => {
    const granted = await watchAd();
    if (granted) grantGrace();
  };

  return (
    <ScreenContainer>
      <View style={{ flex: 1, gap: spacing.lg }}>
        <AppText variant="sectionTitle" color={colors.warning}>
          {t("altar.title")}
        </AppText>

        {banner && (
          <View style={{ backgroundColor: colors.surfaceAlt, padding: spacing.sm, borderRadius: radius.card }}>
            <AppText variant="caption" color={colors.accent}>
              {banner.nickname}: "{banner.message}"
            </AppText>
          </View>
        )}

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={t("altar.placeholder") ?? undefined}
          placeholderTextColor={colors.textSecondary}
          maxLength={maxLength}
          style={{
            color: colors.textPrimary,
            backgroundColor: colors.surfaceAlt,
            borderRadius: radius.input,
            padding: spacing.md,
          }}
        />
        <AppText variant="small" color={colors.borderLight}>
          {t("altar.charCount", { count: message.length })}
        </AppText>

        <Button label={t("altar.submitCta")} variant="primary" onPress={submit} />

        <Button
          label={isLoading ? "..." : t("shop.oxygenMask")}
          variant="outline"
          onPress={handleWatchAd}
          disabled={isLoading}
        />

        <DevBatteryControls />
      </View>
    </ScreenContainer>
  );
}
