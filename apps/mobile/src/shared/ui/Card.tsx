import React from "react";
import { View, type ViewProps } from "react-native";
import { colors, elevation, radius, spacing } from "../theme/tokens";

interface Props extends ViewProps {
  elevated?: boolean;
}

/** DESIGN.md 4절 "Cards & Containers" */
export function Card({ elevated, style, children, ...rest }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.card,
          padding: spacing.lg,
        },
        elevated && elevation.elevated,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
