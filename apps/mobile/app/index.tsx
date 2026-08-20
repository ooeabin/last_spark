import React from "react";
import { StateMachineRoot } from "@/app/StateMachineRoot";

/**
 * Expo Router 진입점. 라우팅 자체는 이 한 화면뿐이고, 실제 "화면 전환"은
 * StateMachineRoot가 gameState를 보고 직접 처리한다(src/app/StateMachineRoot.tsx 참고).
 */
export default function Index() {
  return <StateMachineRoot />;
}
