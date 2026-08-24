import React from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import { canEnterLounge } from "@last-spark/shared";
import { useGameStateStore, DevBatteryControls } from "@/features/battery-tracking";
import { detectCountryCode } from "@/entities/room";
import { CharacterSprite, usePlayerIdentity } from "@/entities/player";
import { BatteryStatusBar } from "@/widgets/status-bar";
import { LeaderboardBanner } from "@/widgets/leaderboard-banner";
import { GravestoneGallery } from "@/widgets/gravestone-gallery";
import { AppText, Button, ScreenContainer } from "@/shared/ui";
import { colors, spacing } from "@/shared/theme/tokens";

/**
 * A. 대기 모드 (기획서 2.2, 4.1)
 *
 * 배터리 잔량과 무관하게 앱을 켜면 항상 이 화면부터 시작한다. 10% 초과거나
 * 충전 중이면 "대기 중", 10% 이하 + 미충전이면 "입장 가능"으로 바뀌면서
 * 입장 버튼이 열린다.
 *
 * 조건을 만족해도 자동으로 넘어가지 않는 이유는 입장이 되돌릴 수 없는
 * 진입(방전 시한부 세션의 시작)이기 때문이다 — 마지막 확인은 유저가 누른다.
 */
export function WaitingScreen() {
  const { t } = useTranslation();
  const batteryLevel = useGameStateStore((s) => s.batteryLevel);
  const isCharging = useGameStateStore((s) => s.isCharging);
  const enterLounge = useGameStateStore((s) => s.enterLounge);
  const charId = usePlayerIdentity((s) => s.charId);
  const nickname = usePlayerIdentity((s) => s.nickname);
  const countryCode = detectCountryCode();

  const canEnter = canEnterLounge(batteryLevel, isCharging);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: spacing.lg }}>
        <View>
          <AppText variant="sectionTitle">{t("common.appName")}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {t("common.slogan")}
          </AppText>
        </View>

        <BatteryStatusBar batteryLevel={batteryLevel} mode="waiting" />

        {/* 화면 가운데 — 내 캐릭터와 입장 상태 */}
        <View style={{ alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl }}>
          <CharacterSprite charId={charId} nickname={nickname} />

          <AppText
            variant="featureHeading"
            color={canEnter ? colors.accent : colors.textSecondary}
          >
            {canEnter ? t("waiting.readyTitle") : t("waiting.waitingTitle")}
          </AppText>

          <AppText
            variant="caption"
            color={colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            {canEnter
              ? t("waiting.readyHint")
              : isCharging
                ? t("waiting.chargingHint")
                : t("waiting.waitingHint")}
          </AppText>

          {canEnter ? (
            <Button label={t("waiting.enterCta")} variant="primary" onPress={enterLounge} />
          ) : null}
        </View>

        <LeaderboardBanner />
        <GravestoneGallery countryCode={countryCode} />

        <DevBatteryControls />
      </ScrollView>
    </ScreenContainer>
  );
}
