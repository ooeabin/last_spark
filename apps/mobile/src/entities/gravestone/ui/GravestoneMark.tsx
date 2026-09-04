import React from "react";
import { Card, AppText } from "@/shared/ui";
import { colors, radius, spacing } from "@/shared/theme/tokens";

interface Props {
  /** 묘비에 새겨진 유언(없으면 빈 묘비 — 아직 작성 전) */
  message?: string;
  /** 유언 아래 표시할 이름 */
  nickname?: string;
}

/**
 * 묘비 (기획서 2.2-E, 4.2-C) — 제단에서 작성 중인 유언과 사망 후
 * 생성된 묘비를 같은 형태로 보여준다.
 *
 * 묘비 아트는 기획서 9.4 에셋 단계에서 들어오고, 지금은 이모지로
 * 자리만 잡는다. 들어오면 이 컴포넌트 내부만 교체하면 된다.
 */
export function GravestoneMark({ message, nickname }: Props) {
  return (
    <Card
      elevated
      style={{
        flex: 1,
        borderRadius: radius.panel,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
      }}
    >
      <AppText variant="sectionTitle">🪦</AppText>

      {message ? (
        <AppText variant="bodyBold" color={colors.accent} style={{ textAlign: "center" }}>
          “{message}”
        </AppText>
      ) : null}

      {nickname ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {nickname}
        </AppText>
      ) : null}
    </Card>
  );
}
