import React from "react";
import { Slot } from "expo-router";
import { Providers } from "@/app/Providers";

export default function RootLayout() {
  return (
    <Providers>
      <Slot />
    </Providers>
  );
}
