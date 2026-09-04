import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import type { RoomKey } from "@/features/free-roam";
import { AppText } from "@/shared/ui";
import { colors, radius, spacing } from "@/shared/theme/tokens";

/**
 * 구역 전환 이펙트 (기획서 3.1) — 다른 구역으로 넘어가는 순간 화면이 짧게
 * 어두워졌다 밝아지고, 상단에 구역 이름 배너가 떠올랐다 사라진다.
 * 터치를 가로채면 안 되므로 전체가 pointerEvents="none"이다.
 */

interface Props {
  roomKey: RoomKey;
}

export function RoomTransition({ roomKey }: Props) {
  const { t } = useTranslation();
  const dim = useSharedValue(0);
  const banner = useSharedValue(0);
  const [label, setLabel] = useState(() => t(`lounge.rooms.${roomKey}`));
  const isFirst = useRef(true);

  useEffect(() => {
    setLabel(t(`lounge.rooms.${roomKey}`));
    // 첫 렌더(입장 직후)에는 암전 없이 배너만 — 화면이 뜨자마자 깜빡이면 오류처럼 보인다
    if (isFirst.current) {
      isFirst.current = false;
    } else {
      dim.value = withSequence(withTiming(0.45, { duration: 140 }), withTiming(0, { duration: 400 }));
    }
    banner.value = withSequence(
      withTiming(1, { duration: 220 }),
      withDelay(1300, withTiming(0, { duration: 450 })),
    );
  }, [roomKey, t, dim, banner]);

  const dimStyle = useAnimatedStyle(() => ({ opacity: dim.value }));
  const bannerStyle = useAnimatedStyle(() => ({
    opacity: banner.value,
    transform: [{ translateY: (1 - banner.value) * -8 }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dimStyle]} />
      <Animated.View style={[styles.banner, bannerStyle]}>
        <AppText variant="featureHeading" color={colors.textEmphasis}>
          {label}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    backgroundColor: colors.background,
  },
  banner: {
    position: "absolute",
    top: spacing.xxl,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pillLarge,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
});
