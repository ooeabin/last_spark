import React from "react";
import { useGameStateStore, useRealBatteryTracking } from "@/features/battery-tracking";
import { WaitingScreen } from "@/screens/waiting";
import { LoungeScreen } from "@/screens/lounge";
import { EmergencyScreen } from "@/screens/emergency";
import { AltarScreen } from "@/screens/altar";
import { DeathScreen } from "@/screens/death";

/**
 * 상태머신(기획서 2.2) 그 자체가 네비게이션이다 — 유저가 임의로
 * 화면을 오가는 게 아니라 배터리/충전 상태가 화면을 강제로 바꾼다.
 * 그래서 Expo Router의 스택 네비게이션 대신, 여기서 gameState를
 * 구독해 화면을 직접 스위칭한다. (Expo Router는 app/index.tsx에서
 * 이 컴포넌트를 마운트하는 단일 진입점 용도로만 쓰인다.)
 */
export function StateMachineRoot() {
  useRealBatteryTracking();
  const gameState = useGameStateStore((s) => s.gameState);

  switch (gameState) {
    case "WAITING":
      return <WaitingScreen />;
    case "LOUNGE":
      return <LoungeScreen />;
    case "EMERGENCY":
      return <EmergencyScreen />;
    case "LAST_RITES":
      return <AltarScreen />;
    case "DEAD":
      return <DeathScreen />;
    default:
      return <WaitingScreen />;
  }
}
