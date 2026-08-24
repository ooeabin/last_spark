import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAltar } from "@/features/altar-broadcast";
import { useRewardedAd } from "@/features/rewarded-ad";
import { useGameStateStore, DevBatteryControls } from "@/features/battery-tracking";
import { usePlayerIdentity } from "@/entities/player";
import { GravestoneMark } from "@/entities/gravestone";
import { AppText, Button, Input, ScreenContainer } from "@/shared/ui";
import { colors, radius, spacing } from "@/shared/theme/tokens";

/**
 * D. 1% 임종 모드 (기획서 2.2, 4.2-C) — 방전 제단.
 *
 * 제목 대신 묘비를 화면의 주인공으로 둔다. 입력한 유언이 묘비에 바로
 * 새겨지므로, 지금 무엇을 하는 화면인지는 묘비가 설명한다.
 */
export function AltarScreen() {
  const { t } = useTranslation();
  const { message, setMessage, submit, banner, maxLength } = useAltar();
  const { watchAd, isLoading } = useRewardedAd();
  const grantGrace = useGameStateStore((s) => s.grantGrace);
  const nickname = usePlayerIdentity((s) => s.nickname);

  const handleWatchAd = async () => {
    const granted = await watchAd();
    if (granted) grantGrace();
  };

  return (
    <ScreenContainer>
      <View style={{ flex: 1, gap: spacing.md }}>
        {/* 다른 사람이 방금 남긴 유언 */}
        {banner && (
          <View
            style={{
              backgroundColor: colors.surfaceAlt,
              padding: spacing.sm,
              borderRadius: radius.card,
            }}
          >
            <AppText variant="caption" color={colors.accent} numberOfLines={1}>
              {banner.nickname}: “{banner.message}”
            </AppText>
          </View>
        )}

        <GravestoneMark message={message} nickname={nickname} />

        <Input
          value={message}
          onChangeText={setMessage}
          placeholder={t("altar.placeholder") ?? undefined}
          maxLength={maxLength}
          textAlign="center"
        />

        <Button label={t("altar.submitCta")} variant="primaryLarge" onPress={submit} />

        <Button
          label={isLoading ? "..." : t("shop.oxygenMask")}
          variant="outline"
          onPress={handleWatchAd}
          disabled={isLoading}
          style={{ alignSelf: "center" }}
        />

        <DevBatteryControls />
      </View>
    </ScreenContainer>
  );
}
