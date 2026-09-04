import React from "react";
import { View } from "react-native";
import { CatFrame, type CatAnimation } from "@/entities/player";
import { AppText } from "@/shared/ui";
import { colors } from "@/shared/theme/tokens";

interface Props {
  /** 캐릭터 발밑이 위치할 필드 내 좌표(px) */
  x: number;
  y: number;
  animation: CatAnimation;
  frame: number;
  faceRight: boolean;
  nickname: string;
  /** 근접 채팅 말풍선 (기획서 4.2-B) — 없으면 그리지 않는다 */
  bubble?: string | null;
  /** 내 캐릭터는 닉네임을 accent 색으로 강조한다 */
  isSelf?: boolean;
  scale?: number;
}

/** 라운지에 서 있는 캐릭터 한 명(닉네임 라벨·말풍선 포함) — 로컬/원격 공용 */
export function PlayerAvatar({ x, y, animation, frame, faceRight, nickname, bubble, isSelf, scale = 2.4 }: Props) {
  const width = 60 * scale;
  const height = 90 * scale;

  return (
    <View
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - height,
        width,
        alignItems: "center",
      }}
      pointerEvents="none"
    >
      {bubble ? (
        <View
          style={{
            backgroundColor: colors.surfaceAlt,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 5,
            marginBottom: 4,
            maxWidth: 160,
          }}
        >
          <AppText variant="small">{bubble}</AppText>
        </View>
      ) : null}
      <View
        style={{
          backgroundColor: colors.overlay,
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 2,
          marginBottom: 2,
        }}
      >
        <AppText variant="small" color={isSelf ? colors.accent : colors.textSecondaryBright}>
          {nickname}
        </AppText>
      </View>
      <CatFrame animation={animation} frame={frame} faceRight={faceRight} scale={scale} />
    </View>
  );
}
