import React from "react";
import { Text, type TextProps } from "react-native";
import { colors, typography } from "../theme/tokens";

type Variant = keyof typeof typography;

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
}

export function AppText({ variant = "body", color = colors.textPrimary, style, ...rest }: Props) {
  return <Text style={[typography[variant], { color }, style]} {...rest} />;
}
