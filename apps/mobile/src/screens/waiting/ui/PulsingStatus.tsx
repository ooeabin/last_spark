import React, { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { AppText } from "@/shared/ui";

interface Props {
  label: string;
  color: string;
  /** 켜져 있을 때만 깜빡인다(입장 가능 상태에서는 멈춘다) */
  animated: boolean;
}

const DIM = 0.35;
const PERIOD_MS = 900;

/**
 * 대기 상태 텍스트 — 배터리가 닳기를 기다리는 동안 천천히 명멸한다.
 * 꺼져가는 불빛 톤(기획서 3.1 사이버펑크 폐허 바)을 텍스트로 표현한 것.
 *
 * 접근성: OS의 "동작 줄이기"가 켜져 있으면 애니메이션 없이 고정 표시한다.
 */
export function PulsingStatus({ label, color, animated }: Props) {
  const opacity = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!animated || reducedMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(withTiming(DIM, { duration: PERIOD_MS }), -1, true);
  }, [animated, reducedMotion, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={style}>
      <AppText variant="featureHeading" color={color}>
        {label}
      </AppText>
    </Animated.View>
  );
}
