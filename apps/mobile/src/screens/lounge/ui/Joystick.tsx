import React from "react";
import { View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { colors } from "@/shared/theme/tokens";

/**
 * 가상 조이스틱 (어몽어스식 이동 조작).
 *
 * 베이스 원 안에서 드래그한 벡터를 -1~1로 정규화해 onMove로 넘긴다 — 미는
 * 거리가 곧 속도라서(아날로그) 살짝 밀면 천천히 걷는다. 손을 떼면 썸이
 * 중앙으로 복귀하며 (0,0)을 쏴서 즉시 멈춘다.
 */

const BASE_RADIUS = 56;
const THUMB_RADIUS = 26;

interface Props {
  /** 정규화된 이동 벡터(-1~1). 놓으면 (0, 0). */
  onMove: (nx: number, ny: number) => void;
}

export function Joystick({ onMove }: Props) {
  const { t } = useTranslation();
  const thumbX = useSharedValue(0);
  const thumbY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      let dx = e.translationX;
      let dy = e.translationY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > BASE_RADIUS) {
        dx = (dx / len) * BASE_RADIUS;
        dy = (dy / len) * BASE_RADIUS;
      }
      thumbX.value = dx;
      thumbY.value = dy;
      runOnJS(onMove)(dx / BASE_RADIUS, dy / BASE_RADIUS);
    })
    .onFinalize(() => {
      thumbX.value = withTiming(0, { duration: 120 });
      thumbY.value = withTiming(0, { duration: 120 });
      runOnJS(onMove)(0, 0);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }, { translateY: thumbY.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={styles.base}
        accessibilityRole="adjustable"
        accessibilityLabel={t("lounge.joystick")}
      >
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  base: {
    position: "absolute",
    left: 20,
    bottom: 20,
    width: BASE_RADIUS * 2,
    height: BASE_RADIUS * 2,
    borderRadius: BASE_RADIUS,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.85,
  },
  thumb: {
    width: THUMB_RADIUS * 2,
    height: THUMB_RADIUS * 2,
    borderRadius: THUMB_RADIUS,
    backgroundColor: colors.accent,
  },
});
