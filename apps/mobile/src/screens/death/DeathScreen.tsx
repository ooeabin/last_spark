import React from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useGameStateStore } from "@/features/battery-tracking";
import { ShareCardButton } from "@/features/share-card";
import { ShopList } from "@/features/iap-shop";
import { AppText, Button, Card, ScreenContainer } from "@/shared/ui";
import { colors, spacing } from "@/shared/theme/tokens";

/** E. 방전/사망 처리 (기획서 2.2, 4.2-C) — 묘비 생성 후 대기 화면 복귀 */
export function DeathScreen() {
  const { t } = useTranslation();
  const resetAfterDeath = useGameStateStore((s) => s.resetAfterDeath);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: spacing.lg }}>
        <AppText variant="sectionTitle" color={colors.negative}>
          {t("death.title")}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {t("death.graveCreated")}
        </AppText>

        <ShareCardButton>
          <Card style={{ aspectRatio: 9 / 16, alignItems: "center", justifyContent: "center" }}>
            <AppText variant="featureHeading">🪦</AppText>
            <AppText variant="caption" color={colors.borderLight}>
              결과 카드 미리보기 (9:16)
            </AppText>
          </Card>
        </ShareCardButton>

        <ShopList />

        <View style={{ marginTop: spacing.lg }}>
          <Button label="대기 화면으로" variant="pill" onPress={() => resetAfterDeath(100)} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
