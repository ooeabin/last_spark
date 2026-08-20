import React from "react";
import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import { colors, radius, spacing, typography } from "../theme/tokens";

type Variant = "primary" | "pill" | "outline" | "circular";

interface Props extends PressableProps {
  label: string;
  variant?: Variant;
}

/**
 * DESIGN.md 4절 "Buttons" — Dark Pill / Outlined Pill / Circular Play를
 * 그대로 옮긴 버튼. 라벨은 uppercase + wide letter-spacing 시스템을 따른다.
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
      <Text style={[styles.label, variant === "outline" && { color: colors.textPrimary }]}>
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
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent },
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
