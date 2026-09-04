import React from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useGameStateStore } from "@/features/battery-tracking";
import { ShareCardButton } from "@/features/share-card";
import { ShopList } from "@/features/iap-shop";
import { usePlayerIdentity } from "@/entities/player";
import { GravestoneMark } from "@/entities/gravestone";
import { AppText, Button, ScreenContainer } from "@/shared/ui";
import { colors, spacing } from "@/shared/theme/tokens";

/** E. 방전/사망 처리 (기획서 2.2, 4.2-C) — 묘비 생성 후 대기 화면 복귀 */
export function DeathScreen() {
  const { t } = useTranslation();
  const resetAfterDeath = useGameStateStore((s) => s.resetAfterDeath);
  const nickname = usePlayerIdentity((s) => s.nickname);
  const lastWords = useGameStateStore((s) => s.lastWords);

  return (
    <ScreenContainer>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ gap: spacing.lg }}>
        <AppText variant="sectionTitle" color={colors.negative}>
          {t("death.title")}
        </AppText>

        <ShareCardButton>
          <View style={{ aspectRatio: 9 / 16 }}>
            <GravestoneMark message={lastWords ?? undefined} nickname={nickname} />
          </View>
        </ShareCardButton>

        <ShopList />

        <Button label={t("death.backCta")} variant="pill" onPress={() => resetAfterDeath(100)} />
      </ScrollView>
    </ScreenContainer>
  );
}
