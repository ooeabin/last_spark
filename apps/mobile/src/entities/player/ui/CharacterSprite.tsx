import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText, Card } from "@/shared/ui";
import { colors, radius, spacing } from "@/shared/theme/tokens";

interface Props {
  /** 표시할 캐릭터. 스프라이트가 들어오기 전까지는 자리표시자가 같아 아직 읽지 않는다. */
  charId: string;
  /** 캐릭터 아래에 함께 보여줄 닉네임(없으면 캐릭터만) */
  nickname?: string;
}

/**
 * 플레이어 캐릭터 표시 — 아직 자리표시자다.
 *
 * char_01~char_12 도트 스프라이트는 기획서 9.4 "아트 디렉션 고정" 단계에서
 * PixelLab으로 제작할 예정이라 지금은 에셋이 없다. 에셋이 들어오면 이
 * 컴포넌트 내부만 react-native-skia Canvas(charId → 스프라이트 시트 매핑)로
 * 교체하면 되고, 호출부는 charId만 넘기므로 손댈 필요가 없다.
 *
 * 깊이는 테두리가 아니라 그림자로 준다(DESIGN.md 7절 "raw gray border 노출 금지").
 */
export function CharacterSprite({ charId, nickname }: Props) {
  const { t } = useTranslation();

  return (
    <View style={{ alignItems: "center", gap: spacing.sm }}>
      <Card
        elevated
        style={{
          width: 180,
          height: 180,
          borderRadius: radius.panel,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppText variant="small" color={colors.textSecondary}>
          {t("common.spritePending")}
        </AppText>
      </Card>

      {nickname ? <AppText variant="bodyBold">{nickname}</AppText> : null}
    </View>
  );
}
