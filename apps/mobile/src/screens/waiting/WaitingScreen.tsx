import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { canEnterLounge } from "@last-spark/shared";
import { useGameStateStore, DevBatteryControls } from "@/features/battery-tracking";
import { detectCountryCode } from "@/entities/room";
import { CharacterSprite, usePlayerIdentity } from "@/entities/player";
import { NicknameField } from "@/features/nickname-edit";
import { PulsingStatus } from "./ui/PulsingStatus";
import { WaitingStage } from "./ui/WaitingStage";
import { LeaderboardBanner } from "@/widgets/leaderboard-banner";
import { GravestoneGallery } from "@/widgets/gravestone-gallery";
import { AppText, Button, ScreenContainer } from "@/shared/ui";
import { colors, radius, spacing } from "@/shared/theme/tokens";

/**
 * A. 대기 모드 (기획서 2.2, 4.1)
 *
 * 배터리 잔량과 무관하게 앱을 켜면 항상 이 화면부터 시작한다. 10% 초과거나
 * 충전 중이면 대기 상태, 10% 이하 + 미충전이면 입장 가능으로 바뀌면서
 * 입장 버튼이 열린다.
 *
 * 조건을 만족해도 자동으로 넘어가지 않는 이유는 입장이 되돌릴 수 없는
 * 진입(방전 시한부 세션의 시작)이기 때문이다 — 마지막 확인은 유저가 누른다.
 *
 * 화면 자체는 스크롤하지 않는다. 대기 화면은 한눈에 들어와야 하는 상태
 * 화면이라, 아래 유언 목록만 자기 영역 안에서 스크롤한다.
 */
export function WaitingScreen() {
  const { t } = useTranslation();
  const batteryLevel = useGameStateStore((s) => s.batteryLevel);
  const isCharging = useGameStateStore((s) => s.isCharging);
  const enterLounge = useGameStateStore((s) => s.enterLounge);
  const charId = usePlayerIdentity((s) => s.charId);
  const countryCode = detectCountryCode();

  const canEnter = canEnterLounge(batteryLevel, isCharging);

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <View style={styles.headerRow}>
          <DevBatteryControls />
        </View>

        <LeaderboardBanner />

        {/* 잿불 홀 배경 위에 내 캐릭터 — 입장하면 들어갈 공간을 미리 보여준다 */}
        <WaitingStage>
          <View style={styles.stageHero}>
            <CharacterSprite charId={charId} />
          </View>
          <View style={styles.stagePanel}>
            <NicknameField />

            <PulsingStatus
              label={canEnter ? t("waiting.readyTitle") : t("waiting.waitingTitle")}
              color={canEnter ? colors.accent : colors.textSecondaryBright}
              animated={!canEnter}
            />

            {!canEnter && (
              <AppText variant="caption" color={colors.textSecondaryBright}>
                {isCharging
                  ? t("waiting.chargingHint")
                  : t("waiting.enterIn", { percent: batteryLevel - 10 })}
              </AppText>
            )}
          </View>
        </WaitingStage>

        {/* 입장 조건을 못 채웠어도 버튼 자리는 유지한다 — 조건 충족 순간
            버튼이 갑자기 나타나며 레이아웃이 점프하지 않게. */}
        <Button
          label={t("waiting.enterCta")}
          variant="primaryLarge"
          onPress={enterLounge}
          disabled={!canEnter}
        />

        {/* 유언 영역 — 배경 단계를 한 칸 올려 입장 영역과 다른 면으로 읽히게 한다
            (DESIGN.md 6절 "depth through shade variation", 테두리 대신 음영). */}
        <View style={styles.lastWordsSection}>
          <GravestoneGallery countryCode={countryCode} scrollEnabled />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.md },
  // zIndex를 올려둬야 펼친 DEV 패널이 아래 콘텐츠에 가리지 않는다.
  headerRow: { flexDirection: "row", justifyContent: "flex-end", zIndex: 20 },
  stageHero: { flex: 1, alignItems: "center", justifyContent: "center" },
  stagePanel: { alignItems: "center", gap: spacing.sm, paddingBottom: spacing.xl },
  lastWordsSection: {
    // 화면의 3분의 1까지만 쓰고 그 안에서 스크롤한다 — 캐릭터 영역을 밀지 않도록.
    maxHeight: "33%",
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    padding: spacing.lg,
  },
});
