import React from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { colors, radius, spacing, typography } from "../theme/tokens";

/** DESIGN.md 4절 "Inputs" — 알약 형태, `#1f1f1f` 바탕, 흰 텍스트 */
export function Input({ style, ...rest }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      // 한 줄 입력이므로 완료 키로 키보드를 닫을 수 있게 한다.
      returnKeyType="done"
      style={[styles.base, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
