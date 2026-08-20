import React from "react";
import { View } from "react-native";
import { SHOP_ITEMS } from "@last-spark/shared";
import { AppText, Button, Card } from "@/shared/ui";
import { spacing } from "@/shared/theme/tokens";

/**
 * 상점 목록 (기획서 6장). TODO: RevenueCat SDK 연동(실행체크리스트 4단계,
 * App Store Connect/Google Play Console 상품 등록 이후) — 지금은 상품
 * 카탈로그만 서버(/shop/items)에서 받아 보여주는 자리, 실제 결제 로직 없음.
 */
export function ShopList() {
  return (
    <View style={{ gap: spacing.sm }}>
      {SHOP_ITEMS.map((item) => (
        <Card key={item.id}>
          <AppText variant="bodyBold">{item.nameKo}</AppText>
          <AppText variant="caption" color="#b3b3b3">
            {item.kind === "rewarded_ad" ? "무료 (광고 시청)" : `$${item.priceUsd}`}
          </AppText>
          <Button
            label="구매 (준비중)"
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
