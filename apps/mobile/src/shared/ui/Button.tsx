import React from "react";
import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import { colors, radius, spacing, typography } from "../theme/tokens";

type Variant = "primary" | "primaryLarge" | "pill" | "outline" | "circular";

interface Props extends PressableProps {
  label: string;
  variant?: Variant;
}

/** accent로 채운 variant는 밝은 바탕이라 라벨을 근흑으로 뒤집는다(대비 확보). */
const ACCENT_FILLED: Variant[] = ["primary", "primaryLarge"];

/**
 * DESIGN.md 4절 "Buttons" — Dark Pill / Dark Large Pill / Outlined Pill /
 * Circular Play를 그대로 옮긴 버튼. 라벨은 uppercase + letter-spacing 시스템을 따른다.
 *
 * `primaryLarge`는 화면의 주 CTA(예: 라운지 입장) 전용이다 — DESIGN.md의
 * Dark Large Pill(좌우 43px 패딩)처럼 큼직하게 잡아 다른 버튼과 위계를 만든다.
 */
export function Button({ label, variant = "pill", style, ...rest }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && styles.pressed,
        typeof style === "function" ? undefined : style,
      ]}
      {...rest}
    >
      <Text
        style={[
          styles.label,
          variant === "primaryLarge" && styles.labelLarge,
          ACCENT_FILLED.includes(variant) && { color: colors.background },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.fullPill,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.8 },
  label: { ...typography.buttonUppercase, color: colors.textPrimary },
  labelLarge: { fontSize: 16 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent },
  primaryLarge: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    paddingHorizontal: 43, // DESIGN.md "Dark Large Pill"
    borderRadius: radius.pill,
    alignSelf: "stretch",
  },
  pill: { backgroundColor: colors.surfaceAlt },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  circular: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.circle,
    width: 48,
    height: 48,
    paddingHorizontal: 0,
  },
});
