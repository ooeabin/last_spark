import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { SHOP_ITEMS, type ShopItemId } from "@last-spark/shared";
import { AppText, Button, Card } from "@/shared/ui";
import { colors, spacing } from "@/shared/theme/tokens";

/**
 * 상점 목록 (기획서 6장). TODO: RevenueCat SDK 연동(실행체크리스트 4단계,
 * App Store Connect/Google Play Console 상품 등록 이후) — 지금은 상품
 * 카탈로그만 보여주는 자리, 실제 결제 로직 없음.
 */

/** SHOP_ITEMS.id → i18n 키 (shop.*) — 상품명은 로케일별 번역을 쓴다 */
const NAME_KEY: Record<ShopItemId, string> = {
  oxygen_mask: "shop.oxygenMask",
  traitor_pass: "shop.traitorPass",
  custom_grave: "shop.customGrave",
  hall_of_fame_banner: "shop.hallOfFameBanner",
};

export function ShopList() {
  const { t } = useTranslation();

  return (
    <View style={{ gap: spacing.sm }}>
      {SHOP_ITEMS.map((item) => (
        <Card key={item.id}>
          <AppText variant="bodyBold">{t(NAME_KEY[item.id])}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {item.kind === "rewarded_ad" ? t("shop.freeWithAd") : `$${item.priceUsd}`}
          </AppText>
          <Button
            label={t("shop.buyPending")}
            variant="outline"
            disabled
            onPress={() => {}}
            style={{ marginTop: spacing.xs, alignSelf: "flex-start" }}
          />
        </Card>
      ))}
    </View>
  );
}
