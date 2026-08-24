import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { Gravestone } from "@last-spark/shared";
import { env } from "@/shared/config/env";
import { AppText, Card } from "@/shared/ui";
import { colors, spacing } from "@/shared/theme/tokens";

/** 명예의 묘비 갤러리 (기획서 4.1) — 자국 유저들의 유언 목록, 좋아요 정렬 */
interface Props {
  countryCode: string;
  /** 자체 영역 안에서 스크롤할지 (바깥이 스크롤을 맡으면 false) */
  scrollEnabled?: boolean;
}

export function GravestoneGallery({ countryCode, scrollEnabled = false }: Props) {
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
    <View style={{ flex: scrollEnabled ? 1 : undefined }}>
      <AppText variant="featureHeading" style={{ marginBottom: spacing.sm }}>
        {t("waiting.gravestoneGalleryTitle")}
      </AppText>
      {loading && <AppText variant="caption">...</AppText>}
      {!loading && gravestones.length === 0 && (
        <AppText variant="caption" color={colors.textSecondary}>
          {t("waiting.gravestoneEmpty")}
        </AppText>
      )}
      <FlatList
        data={gravestones}
        keyExtractor={(item) => item.id}
        scrollEnabled={scrollEnabled}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm, backgroundColor: colors.surfaceAlt }}>
            <AppText variant="bodyBold">{item.nickname}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              "{item.lastWords}"
            </AppText>
            <AppText variant="small" color={colors.borderLight}>
              ♥ {item.likesCount}
            </AppText>
          </Card>
        )}
      />
    </View>
  );
}
