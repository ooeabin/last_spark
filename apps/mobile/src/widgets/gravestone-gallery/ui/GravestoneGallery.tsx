import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { Gravestone } from "@last-spark/shared";
import { env } from "@/shared/config/env";
import { AppText, Card } from "@/shared/ui";
import { spacing } from "@/shared/theme/tokens";

/** 명예의 묘비 갤러리 (기획서 4.1) — 자국 유저들의 유언 목록, 좋아요 정렬 */
export function GravestoneGallery({ countryCode }: { countryCode: string }) {
  const { t } = useTranslation();
  const [gravestones, setGravestones] = useState<Gravestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch(`${env.socketServerUrl}/gravestones?countryCode=${countryCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setGravestones(data.gravestones ?? []);
      })
      .catch((err) => console.warn("[GravestoneGallery] fetch failed:", err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [countryCode]);

  return (
    <View>
      <AppText variant="featureHeading" style={{ marginBottom: spacing.sm }}>
        {t("waiting.gravestoneGalleryTitle")}
      </AppText>
      {loading && <AppText variant="caption">...</AppText>}
      {!loading && gravestones.length === 0 && (
        <AppText variant="caption" color="#b3b3b3">
          아직 이 라운지에서 방전된 사람이 없어요.
        </AppText>
      )}
      <FlatList
        data={gravestones}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.xs }}>
            <AppText variant="bodyBold">{item.nickname}</AppText>
            <AppText variant="caption" color="#b3b3b3">
              "{item.lastWords}"
            </AppText>
            <AppText variant="small" color="#7c7c7c">
              ♥ {item.likesCount}
            </AppText>
          </Card>
        )}
      />
    </View>
  );
}
